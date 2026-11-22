require('dotenv').config();

const fs = require('fs');
const path = require('path');

const app = require('./app');
const sequelize = require('./config/sequelize');

const PORT = process.env.PORT || 3005;

async function startServer() {
  try {
    const jwtSecret = process.env.JWT_SECRET || '';
    if (jwtSecret.length < 32 || /change_this|replace_with|placeholder/i.test(jwtSecret)) {
      throw new Error('Configura JWT_SECRET con el mismo secreto de auth y al menos 32 caracteres.');
    }

    const storageDirectory = path.resolve(
      process.env.TICKETS_STORAGE || 'storage/tickets'
    );

    await fs.promises.mkdir(storageDirectory, {
      recursive: true
    });

    await sequelize.authenticate();

    console.log('Conexión con PostgreSQL establecida');

    app.listen(PORT, () => {
      console.log(`Tickets service ejecutándose en puerto ${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar Tickets:', error);
    process.exit(1);
  }
}

startServer();
