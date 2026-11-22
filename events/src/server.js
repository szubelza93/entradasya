
require('dotenv').config();

const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 3002;

async function startServer() {
  try {
    await sequelize.authenticate();

    console.log('Conexión con PostgreSQL establecida.');

    app.listen(PORT, () => {
      console.log(
        `Microservicio Events ejecutándose en puerto ${PORT}`
      );
    });

  } catch (error) {
    console.error(
      'Error al iniciar el microservicio:',
      error
    );

    process.exit(1);
  }
}

startServer();

