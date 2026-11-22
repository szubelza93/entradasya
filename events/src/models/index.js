
const sequelize = require('../config/sequelize');

const Event = require('./event')(sequelize);
const Sector = require('./sector')(sequelize);
const Reservation = require('./reservation');

Reservation.initModel(sequelize);

Event.hasMany(Sector, {
  as: 'sectores',
  foreignKey: 'eventId',
  onDelete: 'CASCADE'
});

Sector.belongsTo(Event, {
  as: 'evento',
  foreignKey: 'eventId'
});

module.exports = {
  sequelize,
  Event,
  Sector,
  Reservation
};

