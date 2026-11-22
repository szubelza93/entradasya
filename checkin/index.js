require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
const ticketsUrl = (process.env.TICKETS_URL || 'http://127.0.0.1:3005/api/tickets')
  .replace(/\/+$/, '');
const pool = new Pool(process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

app.use(cors({
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : false
}));
app.use(express.json({ limit: '1mb' }));

app.get('/health', async (req, res) => {
  const checks = { database: 'ok', tickets: 'ok' };
  try {
    await pool.query('SELECT 1');
  } catch (error) {
    checks.database = 'error';
    console.error('Checkin health check database failed:', error.message);
  }

  try {
    await axios.get(`${ticketsUrl}/health`, { timeout: 3000 });
  } catch (error) {
    checks.tickets = 'error';
    console.error('Checkin health check Tickets failed:', error.message);
  }

  const ready = Object.values(checks).every(status => status === 'ok');
  res.status(ready ? 200 : 503).json({
    service: 'checkin',
    status: ready ? 'ok' : 'error',
    checks,
    timestamp: new Date().toISOString()
  });
});

function authenticatePortero(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : null;

  if (!token) {
    return res.status(401).json({ message: 'Token de autenticación requerido' });
  }

  let user;
  try {
    user = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256']
    });
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }

  const porterId = Number(user.sub || user.id);
  const role = user.role || user.rol;
  if (!Number.isSafeInteger(porterId) || porterId <= 0) {
    return res.status(401).json({ message: 'El token no contiene una identidad válida.' });
  }
  if (role !== 'portero') {
    return res.status(403).json({ message: 'Acceso denegado. Se requiere rol portero.' });
  }

  req.user = { id: porterId };
  req.token = token;
  return next();
}

function formatAdmissionTime(value) {
  if (!value) return null;
  return new Date(value).toLocaleTimeString('es-BO', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function usedMessage(value) {
  const time = formatAdmissionTime(value);
  return time
    ? `Entrada ya utilizada. Ingresó a las ${time}.`
    : 'Entrada ya utilizada.';
}

async function findAdmission(ticketId, code) {
  const result = await pool.query(
    'SELECT created_at FROM checkins WHERE ticket_id = $1 OR ticket_code = $2 ORDER BY created_at ASC LIMIT 1',
    [ticketId, code]
  );
  return result.rows[0] || null;
}

async function validateWithTickets(code, token) {
  try {
    const response = await axios.post(
      `${ticketsUrl}/validate`,
      { code },
      {
        timeout: 5000,
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  } catch (error) {
    if (error.response && [400, 404].includes(error.response.status)) {
      return { exists: false, valid: false };
    }
    console.error('No se pudo consultar Tickets:', error.message);
    throw Object.assign(new Error('No se pudo validar la entrada con Tickets.'), {
      status: 502
    });
  }
}

app.post('/scan', authenticatePortero, async (req, res) => {
  const code = typeof req.body?.code === 'string' ? req.body.code.trim().toUpperCase() : '';
  const eventId = Number(req.body?.eventId);

  if (!code || !Number.isSafeInteger(eventId) || eventId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Se requieren un código de entrada y un evento válido.'
    });
  }

  let admission;
  try {
    const validation = await validateWithTickets(code, req.token);

    if (!validation.exists || !validation.ticket) {
      return res.status(400).json({
        success: false,
        message: 'Código inválido o no encontrado.'
      });
    }

    const ticket = validation.ticket;
    if (Number(ticket.eventId) !== eventId) {
      return res.status(400).json({
        success: false,
        message: 'La entrada pertenece a otro evento.'
      });
    }

    if (ticket.status === 'usada') {
      const previous = await findAdmission(ticket.id, code);
      return res.status(409).json({
        success: false,
        message: usedMessage(previous?.created_at || ticket.usedAt)
      });
    }

    if (!validation.valid || ticket.status !== 'emitida') {
      return res.status(400).json({
        success: false,
        message: ticket.status === 'cancelada'
          ? 'La entrada está cancelada.'
          : 'La entrada no es válida o no está pagada.'
      });
    }

    try {
      const inserted = await pool.query(
        'INSERT INTO checkins (ticket_id, event_id, ticket_code, porter_id) VALUES ($1, $2, $3, $4) RETURNING id, created_at',
        [ticket.id, eventId, code, req.user.id]
      );
      admission = inserted.rows[0];
    } catch (error) {
      if (error.code !== '23505') throw error;
      const previous = await findAdmission(ticket.id, code);
      return res.status(409).json({
        success: false,
        message: usedMessage(previous?.created_at)
      });
    }

    try {
      await axios.post(
        `${ticketsUrl}/${encodeURIComponent(code)}/check-in`,
        {},
        {
          timeout: 5000,
          headers: { Authorization: `Bearer ${req.token}` }
        }
      );
    } catch (error) {
      await pool.query('DELETE FROM checkins WHERE id = $1', [admission.id]);

      if (error.response?.status === 409) {
        const latestValidation = await validateWithTickets(code, req.token);
        const usedAt = latestValidation.ticket?.usedAt;
        return res.status(409).json({
          success: false,
          message: usedMessage(usedAt)
        });
      }
      if (error.response && [400, 404].includes(error.response.status)) {
        return res.status(400).json({
          success: false,
          message: error.response.data?.message || 'La entrada no es válida.'
        });
      }

      console.error('No se pudo registrar la entrada en Tickets:', error.message);
      return res.status(502).json({
        success: false,
        message: 'No se pudo registrar la entrada en Tickets. Intenta nuevamente.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Ingreso permitido',
      ticket: {
        eventTitle: ticket.eventName,
        sectorName: ticket.sectorName
      },
      admittedAt: admission.created_at
    });
  } catch (error) {
    console.error('Error en checkin:', error.message);
    return res.status(error.status || 500).json({
      success: false,
      message: error.status ? error.message : 'Error interno del servidor'
    });
  }
});

app.get('/stats', authenticatePortero, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT event_id, COUNT(*)::integer AS total_ingresos FROM checkins GROUP BY event_id'
    );
    res.json({
      data: result.rows.map(row => ({
        eventId: row.event_id,
        totalIngresos: row.total_ingresos
      }))
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error.message);
    res.status(500).json({ message: 'Error obteniendo estadísticas' });
  }
});

app.get('/stats/:eventId', authenticatePortero, async (req, res) => {
  const eventId = Number(req.params.eventId);
  if (!Number.isSafeInteger(eventId) || eventId <= 0) {
    return res.status(400).json({ message: 'El evento indicado no es válido.' });
  }

  try {
    const result = await pool.query(
      'SELECT COUNT(*)::integer AS total_ingresos FROM checkins WHERE event_id = $1',
      [eventId]
    );
    res.json({ eventId, totalIngresos: result.rows[0].total_ingresos });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error.message);
    res.status(500).json({ message: 'Error obteniendo estadísticas' });
  }
});

const PORT = Number(process.env.PORT || 3007);

async function startServer() {
  const jwtSecret = process.env.JWT_SECRET || '';
  if (jwtSecret.length < 32 || /change_this|replace_with|placeholder/i.test(jwtSecret)) {
    throw new Error('Configura el mismo JWT_SECRET de auth con al menos 32 caracteres.');
  }
  if (
    !process.env.DATABASE_URL &&
    (!process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_USER)
  ) {
    throw new Error('Configura DATABASE_URL o DB_HOST, DB_NAME y DB_USER.');
  }

  await pool.query('SELECT 1');

  app.listen(PORT, () => {
    console.log(`Checkin service ejecutándose en puerto ${PORT}`);
  });
}

startServer().catch(async error => {
  console.error('Error al iniciar Checkin:', error.message);
  await pool.end();
  process.exitCode = 1;
});
