const signatures = {
  jpeg(buffer) {
    return buffer.length >= 3
      && buffer[0] === 0xff
      && buffer[1] === 0xd8
      && buffer[2] === 0xff;
  },
  png(buffer) {
    return buffer.length >= 8
      && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  },
  webp(buffer) {
    return buffer.length >= 12
      && buffer.toString('ascii', 0, 4) === 'RIFF'
      && buffer.toString('ascii', 8, 12) === 'WEBP';
  }
};

module.exports = (req, res, next) => {
  if (!req.file) return next();

  const matchesSignature = {
    'image/jpeg': signatures.jpeg,
    'image/png': signatures.png,
    'image/webp': signatures.webp
  }[req.file.mimetype]?.(req.file.buffer);

  if (!matchesSignature) {
    return res.status(400).json({
      message: 'El contenido del archivo no coincide con el formato de imagen declarado.'
    });
  }

  next();
};
