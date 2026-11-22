
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Sector', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    eventId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'event_id'
    },

    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },

    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },

    cupo: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }

  }, {
    tableName: 'sectors',
    underscored: true,
    timestamps: true,
    indexes: [
      { unique: true, fields: ['event_id', 'nombre'] }
    ]
  });
};

