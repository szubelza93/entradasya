require('dotenv').config();

const app = require('./app');
const { verifyConnection } = require('./services/email.service');

const PORT = process.env.PORT || 3006;

async function startServer() {
  try {
    await verifyConnection();

    console.log('Conexión SMTP establecida.');

    app.listen(PORT, () => {
      console.log(`Notifications ejecutándose en http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('No se pudo conectar con el servidor SMTP configurado:', error.message);
    process.exit(1);
  }
}

startServer();
