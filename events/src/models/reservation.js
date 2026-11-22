const { Model, DataTypes } = require('sequelize');

class Reservation extends Model {
  static initModel(sequelize) {
    Reservation.init({
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      orderItemId: { type: DataTypes.STRING(120), allowNull: false, unique: true, field: 'order_item_id' },
      eventId: { type: DataTypes.INTEGER, allowNull: false, field: 'event_id' },
      sectorId: { type: DataTypes.INTEGER, allowNull: false, field: 'sector_id' },
      cantidad: { type: DataTypes.INTEGER, allowNull: false },
      estado: {
        type: DataTypes.ENUM('reserved', 'released'),
        allowNull: false,
        defaultValue: 'reserved'
      }
    }, {
      sequelize,
      modelName: 'Reservation',
      tableName: 'reservations',
      timestamps: true,
      indexes: [
        { fields: ['event_id', 'sector_id'] },
        { fields: ['estado'] }
      ]
    });
    return Reservation;
  }
}

module.exports = Reservation;
