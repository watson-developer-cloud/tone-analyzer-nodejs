const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const secure = require('express-secure-only');

module.exports = function(app) {
  app.enable('trust proxy');

  // 0. redirects http to https
  app.use(secure());

  // 1. helmet with defaults
  app.use(helmet({
    cacheControl: false,
    frameguard: false
  }));

  // 2. rate limiting
  app.use('/api/', rateLimit({
    windowMs: 30 * 1000, // seconds
    delayMs: 0,
    max: 6,
    message: JSON.stringify({
      error: 'Too many requests, please try again in 30 seconds.',
      code: 429
    })
  }));
};
