
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Event', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    organizerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'organizer_id'
    },

    nombre: {
      type: DataTypes.STRING(160),
      allowNull: false
    },

    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    fecha: {
      type: DataTypes.DATE,
      allowNull: false
    },

    lugar: {
      type: DataTypes.STRING(220),
      allowNull: false
    },

    imagenUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'imagen_url'
    },

    estado: {
      type: DataTypes.ENUM(
        'borrador',
        'publicado',
        'cancelado'
      ),
      allowNull: false,
      defaultValue: 'borrador'
    }

  }, {
    tableName: 'events',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['estado', 'fecha'] },
      { fields: ['organizer_id', 'fecha'] }
    ]
  });
};
