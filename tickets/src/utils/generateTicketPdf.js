const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const WIDTH = 800;
const HEIGHT = 300;
const LEFT_WIDTH = WIDTH * 0.1;
const CENTER_WIDTH = WIDTH * 0.60;
const RIGHT_X = LEFT_WIDTH + CENTER_WIDTH;
const RIGHT_WIDTH = WIDTH * 0.3;
const CROWD_IMAGE_PATH = path.resolve(
  __dirname,
  '../../assets/concert-crowd-monochrome.png'
);

const COLORS = {
  red: '#D9272E',
  redDark: '#B91F27',
  black: '#101010',
  photoPlaceholder: '#D9D9D9',
  white: '#FFFFFF',
  gray: '#E5E5E5'
};

function formatEventDate(value) {
  const date = new Date(value);
  const datePart = new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
  const timePart = new Intl.DateTimeFormat('es-BO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);

  return `${datePart} | ${timePart}`;
}

function drawRightPanel(doc, ticket) {
  const hasCrowdImage = fs.existsSync(CROWD_IMAGE_PATH);

  if (hasCrowdImage) {
    doc.image(CROWD_IMAGE_PATH, RIGHT_X, 0, {
      width: RIGHT_WIDTH,
      height: HEIGHT,
      
    });

    // Dark overlay keeps the concert photo atmospheric behind the QR card.
    doc.save();
    doc.fillColor(COLORS.gray)
      .fillOpacity(0.38)
      .rect(RIGHT_X, 0, RIGHT_WIDTH, HEIGHT)
      .fill();
    doc.restore();
  } else {
    doc.rect(RIGHT_X, 0, RIGHT_WIDTH, HEIGHT).fill(COLORS.photoPlaceholder);
  }

  const cardWidth = 194;
  const cardHeight = 206;
  const cardX = RIGHT_X + (RIGHT_WIDTH - cardWidth) / 2;
  const cardY = 30;
  const qrSize = 172;

  doc.save();
  
  doc.image(ticket.qrBuffer, cardX + (cardWidth - qrSize) / 2, cardY + 10, {
    width: qrSize,
    height: qrSize
  });
  doc.restore();

//   doc.fillColor(hasCrowdImage ? COLORS.white : COLORS.black)
//     .font('Helvetica-Bold')
//     .fontSize(10)
//     .text(ticket.code, RIGHT_X + 8, 250, {
//       width: RIGHT_WIDTH - 16,
//       align: 'center',
//       lineBreak: false
//     });
}

function drawCenterPanel(doc, ticket) {
  const x = LEFT_WIDTH;
  const padding = 28;
  const contentWidth = CENTER_WIDTH - padding * 2;
  const eventDate = formatEventDate(ticket.eventDate);

  doc.rect(x, 0, CENTER_WIDTH, HEIGHT).fill(COLORS.red);

  doc.fillColor(COLORS.white)
    .font('Helvetica-Bold')
    .fontSize(19)
    .text('EntradasYa', x + padding, 18, {
      width: contentWidth,
      align: 'right',
      lineBreak: false
    });

  const eventName = ticket.eventName.toUpperCase();
  const titleOptions = {
    width: contentWidth,
    lineGap: 2
  };

  doc.font('Helvetica-Bold').fontSize(25);
  const titleHeight = Math.min(doc.heightOfString(eventName, titleOptions), 68);
  const titleY = Math.max(58, 145 - titleHeight - 10);

  doc.text(eventName, x + padding, titleY, {
    ...titleOptions,
    height: 70,
    ellipsis: true,
    lineBreak: true
  });

  doc.moveTo(x + padding, 145)
    .lineTo(x + CENTER_WIDTH - padding, 145)
    .strokeColor(COLORS.white)
    .lineWidth(1)
    .stroke();

  doc.font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(COLORS.white)
    .text('FECHA Y HORA', x + padding, 164, {
      width: contentWidth,
      lineBreak: false
    });

  doc.font('Helvetica-Bold')
    .fontSize(15)
    .fillColor(COLORS.white)
    .text(eventDate, x + padding, 181, {
      width: contentWidth,
      lineBreak: false
    });

  doc.font('Helvetica')
    .fontSize(12)
    .fillColor(COLORS.white)
    .text(ticket.eventPlace.toUpperCase(), x + padding, 215, {
      width: contentWidth,
      ellipsis: true,
      lineBreak: false
    });

  const seatText = ticket.seatNumber
    ? `SECTOR ${ticket.sectorName.toUpperCase()} | ASIENTO ${ticket.seatNumber}`
    : `SECTOR ${ticket.sectorName.toUpperCase()}`;

  doc.font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(COLORS.white)
    .text(seatText, x + padding, 246, {
      width: contentWidth,
      ellipsis: true,
      lineBreak: false
    });
}

function drawLeftStrip(doc, ticket) {
  doc.rect(0, 0, LEFT_WIDTH, HEIGHT).fill(COLORS.white);

  doc.save();
  doc.translate(LEFT_WIDTH / 2, HEIGHT / 2);
  doc.rotate(-90);
  doc.fillColor(COLORS.red)
    .font('Helvetica-Bold')
    .fontSize(19)
    .text(ticket.sectorName.toUpperCase(), -HEIGHT / 2 + 12, -12, {
      width: HEIGHT - 24,
      align: 'center',
      lineBreak: false
    });
  doc.restore();
}

function drawTicket(doc, ticket) {
  doc.rect(0, 0, WIDTH, HEIGHT).fill(COLORS.gray);

  drawLeftStrip(doc, ticket);
  drawCenterPanel(doc, ticket);
  drawRightPanel(doc, ticket);

  doc.save();
  doc.moveTo(LEFT_WIDTH, 12)
    .lineTo(LEFT_WIDTH, HEIGHT - 12)
    .strokeColor(COLORS.red)
    .lineWidth(1)
    .stroke();
  doc.restore();
}

async function generateTicketPdf(ticket, destination) {
  const directory = path.dirname(destination);

  await fs.promises.mkdir(directory, {
    recursive: true
  });

  const qrBuffer = await QRCode.toBuffer(ticket.code, {
    type: 'png',
    width: 400,
    margin: 1,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#000000FF',
      light: '#00000000'
    }
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      // PDFKit swaps custom dimensions when layout is landscape. Pass the
      // dimensions in portrait order so the resulting page is WIDTH × HEIGHT.
      size: [HEIGHT, WIDTH],
      margin: 0,
      layout: 'landscape',
      compress: true
    });

    const stream = fs.createWriteStream(destination);
    stream.on('finish', () => resolve(destination));
    stream.on('error', reject);
    doc.on('error', reject);

    doc.pipe(stream);
    drawTicket(doc, {
      ...ticket,
      qrBuffer
    });
    doc.end();
  });
}

module.exports = generateTicketPdf;
