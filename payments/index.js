require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.status(200).json({
      service: 'payments',
      status: 'ok',
      checks: { database: 'ok' },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Payments health check database failed:', error.message);
    return res.status(503).json({
      service: 'payments',
      status: 'error',
      checks: { database: 'error' },
      timestamp: new Date().toISOString()
    });
  }
});

// MIDDLEWARE DE SEGURIDAD (Solo Orders puede llamar)
const verificarApiKey = (req, res, next) => {
  const expected = process.env.API_KEY || '';
  const supplied = req.get('x-api-key') || '';
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);

  if (expectedBuffer.length < 32 || /replace_with|placeholder/i.test(expected)) {
    return res.status(503).json({ message: 'La autenticación de orders no está configurada.' });
  }
  if (
    expectedBuffer.length !== suppliedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, suppliedBuffer)
  ) {
    return res.status(403).json({ message: 'Acceso denegado. API Key inválida.' });
  }
  next();
};

// ENDPOINT: Procesar Pago
app.post('/process', verificarApiKey, async (req, res) => {
  const { orderId, amount, cardNumber } = req.body;

  // 1. Validaciones básicas
  if (!orderId || !amount || !cardNumber) {
    return res.status(400).json({ message: 'Faltan datos: orderId, amount y cardNumber son requeridos.' });
  }

  try {
    // 2. IDEMPOTENCIA: Verificar si la orden ya fue procesada
    const existingTx = await pool.query('SELECT * FROM transacciones WHERE order_id = $1', [orderId]);
    if (existingTx.rows.length > 0) {
      // Si ya existe, devolvemos el mismo resultado sin volver a cobrar
      return res.status(200).json({
        message: 'Pago ya procesado previamente (Idempotencia)',
        transaction: existingTx.rows[0]
      });
    }

    // 3. REGLA DE NEGOCIO: Rechazar si termina en 0000
    const last4 = cardNumber.slice(-4);
    const isRejected = cardNumber.endsWith('0000');
    const status = isRejected ? 'rechazado' : 'aprobado';

    // 4. Guardar la transacción
    const result = await pool.query(
      'INSERT INTO transacciones (order_id, amount, status, last4) VALUES ($1, $2, $3, $4) RETURNING *',
      [orderId, amount, status, last4]
    );

    const transaccion = result.rows[0];

    // 5. Responder según el resultado
    if (status === 'rechazado') {
      return res.status(402).json({
        message: 'Pago rechazado. Tarjeta terminada en 000.',
        transaction: transaccion
      });
    }

    return res.status(200).json({
      message: 'Pago aprobado exitosamente',
      transaction: transaccion
    });

  } catch (error) {
    console.error('Error procesando pago:', error);
    // Si hay un error de llave duplicada (carrera de peticiones), lo atrapamos
    if (error.code === '23505') { 
      return res.status(200).json({ message: 'Pago ya procesado (conflicto resuelto)' });
    }
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Arrancar servidor
const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`Payments service corriendo en http://localhost:${PORT}`);
});