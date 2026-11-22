const crypto = require('crypto');

function generateTicketCode() {
  return `TKT-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
}

module.exports = generateTicketCode;