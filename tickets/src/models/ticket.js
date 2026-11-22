const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Ticket = sequelize.define('Ticket', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },

  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'order_id'
  },

  itemId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'item_id'
  },

  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'customer_id'
  },

  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'event_id'
  },

  eventName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'event_name'
  },

  eventDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'event_date'
  },

  eventPlace: {
    type: DataTypes.STRING(250),
    allowNull: false,
    field: 'event_place'
  },

  sectorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'sector_id'
  },

  sectorName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'sector_name'
  },

  seatNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'seat_number'
  },

  pdfPath: {
    type: DataTypes.STRING(500),
    allowNull: false,
    field: 'pdf_path'
  },

  status: {
    type: DataTypes.ENUM('emitida', 'usada', 'cancelada'),
    allowNull: false,
    defaultValue: 'emitida'
  },

  usedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'used_at'
  }
}, {
  tableName: 'tickets',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['order_id', 'item_id']
    },
    {
      fields: ['customer_id']
    },
    {
      fields: ['event_id']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = Ticket;
