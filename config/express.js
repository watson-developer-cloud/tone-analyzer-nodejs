const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

module.exports = function(app) {
  app.enable('trust proxy');

  // Configure Express
  app.set('view engine', 'ejs');
  require('ejs').delimiter = '$';
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(bodyParser.json());

  require('./i18n')(app);

  // Setup static public directory
  app.use(express.static(path.join(__dirname, '..', '/public')));

  // Only loaded when VCAP_APPLICATION is `true`
  if (process.env.VCAP_APPLICATION) {
    require('./security')(app);
  }
};
