#! /usr/bin/env node
'use strict';

require('dotenv').config({silent: true});

// Deployment tracking
require('cf-deployment-tracker-client').track();

var server = require('./app');
var port = process.env.PORT || process.env.VCAP_APP_PORT || 3000;

server.listen(port, function() {
  // eslint-disable-next-line no-console
  console.log('Server running on port: %d', port);
});
