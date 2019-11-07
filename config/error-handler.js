module.exports = function(app) {
  // catch 404 and forward to error handler
  app.use(function(req, res, next) {
    const err = new Error('Not Found');
    err.code = 404;
    err.message = `Path: ${req.path}, not Found`;
    next(err);
  });

  // error handler
  app.use(function(err, req, res, next) {
    const error = {
      code: err.code || 500,
      error: err.error || err.message
    };
    // eslint-disable-next-line no-console
    console.log('error:', error);
    next ? '' : '';
    res.status(error.code).json(error);
  });
};
