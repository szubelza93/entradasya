require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const internalHeaders = { 'x-api-key': process.env.API_KEY };

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.status(200).json({
      service: 'orders',
      status: 'ok',
      checks: { database: 'ok' },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Orders health check database failed:', error.message);
    return res.status(503).json({
      service: 'orders',
      status: 'error',
      checks: { database: 'error' },
      timestamp: new Date().toISOString()
    });
  }
});

// Middleware para validar JWT del cliente
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Token no proporcionado' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido o expirado' });
    req.user = user;
    next();
  });
};

const paymentHeaders = { 'x-api-key': process.env.API_KEY };
const ordersHeaders = { 'x-orders-key': process.env.ORDERS_API_KEY };

// ENDPOINT: Crear una orden (Comprar)
app.post('/', authenticateToken, async (req, res) => {
  const { eventId, sectorId, quantity, cardNumber } = req.body;
  const userId = Number(req.user.sub);
  const userEmail = req.user.email;
  const userName = req.user.name || userEmail;

  if (req.user.role !== 'cliente') {
    return res.status(403).json({ message: 'Solo los clientes pueden realizar compras' });
  }
  if (
    !Number.isSafeInteger(userId) ||
    userId <= 0 ||
    !userEmail ||
    !Number.isSafeInteger(Number(eventId)) ||
    Number(eventId) <= 0 ||
    !Number.isSafeInteger(Number(sectorId)) ||
    Number(sectorId) <= 0 ||
    !Number.isSafeInteger(Number(quantity)) ||
    Number(quantity) <= 0 ||
    typeof cardNumber !== 'string' ||
    !/^\d{12,19}$/.test(cardNumber)
  ) {
    return res.status(400).json({ message: 'Faltan datos requeridos' });
  }
  if (Number(quantity) > 6) {
    return res.status(400).json({ message: 'Máximo 6 entradas por compra' });
  }

  const parsedEventId = Number(eventId);
  const parsedSectorId = Number(sectorId);
  const parsedQuantity = Number(quantity);
  let orderId;
  let reservationAttempted = false;
  let paymentApproved = false;
  let totalAmount = 0;
  let reservation;

  try {
    const newOrder = await pool.query(
      'INSERT INTO orders (user_id, user_email, event_id, sector_id, quantity, total_amount, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [userId, userEmail, parsedEventId, parsedSectorId, parsedQuantity, 0, 'pendiente']
    );
    orderId = newOrder.rows[0].id;

    reservationAttempted = true;
    const reserveRes = await axios.post(
      `${process.env.EVENTS_URL}/api/events/${parsedEventId}/reserve`,
      { orderId, sectorId: parsedSectorId, quantity: parsedQuantity },
      { headers: ordersHeaders }
    );
    reservation = reserveRes.data;

    if (!reservation.success) {
      const error = new Error('Agotado: No hay cupo suficiente');
      error.response = { status: 409 };
      throw error;
    }

    totalAmount = Number(reservation.total);

    await pool.query('UPDATE orders SET total_amount = $1 WHERE id = $2', [totalAmount, orderId]);

    const paymentRes = await axios.post(
      `${process.env.PAYMENTS_URL}/process`,
      { orderId: orderId.toString(), amount: totalAmount, cardNumber },
      { headers: internalHeaders }
    );

    if (paymentRes.data?.transaction?.status !== 'aprobado') {
      const error = new Error('Pago rechazado');
      error.response = { status: 402 };
      throw error;
    }

    paymentApproved = true;
    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', ['pagada', orderId]);

    let ticketsGenerated = false;
    let emailSent = false;
    let ticketError;
    let emailError;
    const tickets = Array.from({ length: parsedQuantity }, () => ({
      itemId: randomUUID(),
      sectorId: parsedSectorId,
      sectorName: reservation.sectorName
    }));

    try {
      await axios.post(
        `${process.env.TICKETS_URL}/api/tickets/generate`,
        {
          orderId: Number(orderId),
          customerId: userId,
          event: reservation.event,
          tickets
        },
        { headers: ordersHeaders }
      );
      ticketsGenerated = true;
    } catch (errorTickets) {
      console.error('Error generando tickets:', errorTickets.message);
      ticketError = errorTickets.message;
    }

    if (ticketsGenerated) {
      try {
        await axios.post(
          `${process.env.NOTIFICATIONS_URL}/api/notifications/purchase-confirmation`,
          {
            to: userEmail,
            customerName: userName,
            orderId: String(orderId),
            eventName: reservation.event.name,
            ticketsUrl: `${(process.env.WEB_URL || 'http://localhost:5173').replace(/\/$/, '')}/mis-entradas`
          },
          { headers: ordersHeaders }
        );
        emailSent = true;
      } catch (errorEmail) {
        console.error('Error enviando correo:', errorEmail.message);
        emailError = errorEmail.message;
      }
    }

    res.status(201).json({
      message: ticketsGenerated
        ? 'Compra exitosa'
        : 'Pago aprobado, pero no se pudieron emitir las entradas.',
      order: { id: orderId, status: 'pagada', total: totalAmount },
      ticketsGenerated,
      emailSent,
      ...(ticketError ? { ticketError } : {}),
      ...(emailError ? { emailError } : {})
    });

    } catch (error) {
    console.error('--- DETALLE DEL ERROR ---');
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      console.error('Servicio que falló:', error.config.url);
      console.error('Código de estado:', error.response.status);
      console.error('Datos:', error.response.data);
    } else if (error.request) {
      // La petición se hizo pero no hubo respuesta (servicio caído o puerto equivocado)
      console.error('No hubo respuesta del servicio:', error.config.url);
    } else {
      console.error('Error de configuración:', error.message);
    }
    console.error('-------------------------');

    let releaseError;
    if (orderId && reservationAttempted && !paymentApproved) {
      try {
        await axios.post(
          `${process.env.EVENTS_URL}/api/events/${parsedEventId}/release`,
          { orderId },
          { headers: ordersHeaders }
        );
      } catch (errorLiberacion) {
        if (errorLiberacion.response?.status !== 404) {
          releaseError = errorLiberacion.message;
          console.error('Error liberando cupo:', releaseError);
        }
      }
    }

    if (orderId) {
      const status = error.response?.status === 402 ? 'rechazada' : 'cancelada';
      await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, orderId]);
    }

    if (releaseError) {
      return res.status(502).json({
        message: 'No se pudo completar la compra ni liberar la reserva. Requiere revisión.',
        orderId,
        error: releaseError
      });
    }
    if (error.response?.status === 402) {
      return res.status(402).json({ message: 'Pago rechazado' });
    }
    if (error.response?.status === 409) {
      return res.status(409).json({ message: 'Agotado: No hay cupo suficiente' });
    }

    res.status(502).json({ message: 'Error procesando la orden', error: error.message });
  }
});

// ENDPOINT: Historial de compras
app.get('/mias', authenticateToken, async (req, res) => {
  try {
    const orders = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.sub]
    );
    res.json(orders.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo historial' });
  }
});

// Arrancar servidor
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Orders service corriendo en http://localhost:${PORT}`);
});