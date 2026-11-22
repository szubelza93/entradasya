require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const ticketsRoutes = require('./routes/tickets.routes');
const errorHandler = require('./middlewares/errorHandler');
const sequelize = require('./config/sequelize');

const app = express();

async function healthCheck(req, res) {
  try {
    await sequelize.authenticate();
    return res.status(200).json({
      service: 'tickets',
      status: 'ok',
      checks: { database: 'ok' },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Tickets health check database failed:', error.message);
    return res.status(503).json({
      service: 'tickets',
      status: 'error',
      checks: { database: 'error' },
      timestamp: new Date().toISOString()
    });
  }
}

app.use(helmet());
app.use(compression());

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : [];

app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : false
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', healthCheck);
app.get('/api/tickets/health', healthCheck);

app.use('/api/tickets', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100
}));

app.use('/api/tickets', ticketsRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: 'Ruta no encontrada'
  });
});

app.use(errorHandler);

module.exports = app;