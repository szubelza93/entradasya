
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const eventsRoutes = require('./routes/events.routes');
const { errorHandler } = require('./middlewares/errorHandler');
const { sequelize } = require('./models');

const app = express();

async function healthCheck(req, res) {
  try {
    await sequelize.authenticate();
    return res.status(200).json({
      service: 'events',
      status: 'ok',
      checks: { database: 'ok' },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Events health check database failed:', error.message);
    return res.status(503).json({
      service: 'events',
      status: 'error',
      checks: { database: 'error' },
      timestamp: new Date().toISOString()
    });
  }
}

app.use(helmet());

app.use(cors({
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(x => x.trim())
    : false
}));

app.use(compression());

app.use(express.json({
  limit: '1mb'
}));

app.use(express.urlencoded({
  extended: true
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300
}));

app.get('/health', healthCheck);
app.get('/api/events/health', healthCheck);

// Rutas del microservicio
app.use('/api/events', eventsRoutes);

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    message: 'Ruta no encontrada.'
  });
});

// Manejo global de errores
app.use(errorHandler);

module.exports = app;

