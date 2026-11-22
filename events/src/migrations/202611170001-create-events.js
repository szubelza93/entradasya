module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('events', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      organizer_id: { type: Sequelize.INTEGER, allowNull: false },
      nombre: { type: Sequelize.STRING(160), allowNull: false },
      descripcion: { type: Sequelize.TEXT, allowNull: true },
      fecha: { type: Sequelize.DATE, allowNull: false },
      lugar: { type: Sequelize.STRING(220), allowNull: false },
      imagen_url: { type: Sequelize.TEXT, allowNull: true },
      estado: { type: Sequelize.ENUM('borrador', 'publicado', 'cancelado'), allowNull: false, defaultValue: 'borrador' },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addIndex('events', ['estado', 'fecha']);
    await queryInterface.addIndex('events', ['organizer_id', 'fecha']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('events');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_events_estado";');
  }
};
