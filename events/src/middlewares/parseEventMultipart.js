
module.exports = (req, res, next) => {
  try {
    if (typeof req.body.sectores === 'string') {
      req.body.sectores = JSON.parse(req.body.sectores);
    }

    next();
  } catch (error) {
    res.status(400).json({
      message: 'El campo sectores debe contener un JSON válido.'
    });
  }
};
