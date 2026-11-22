module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reservations', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      order_item_id: { type: Sequelize.STRING(120), allowNull: false, unique: true },
      event_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'events', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      sector_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'sectors', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      cantidad: { type: Sequelize.INTEGER, allowNull: false },
      estado: { type: Sequelize.ENUM('reserved', 'released'), allowNull: false, defaultValue: 'reserved' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addIndex('reservations', ['event_id', 'sector_id']);
    await queryInterface.addIndex('reservations', ['estado']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('reservations');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_reservations_estado";');
  }
};
