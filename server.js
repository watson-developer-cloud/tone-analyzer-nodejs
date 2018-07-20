#! /usr/bin/env node
'use strict';

require('dotenv').config({silent: true});

var server = require('./app');
var port = process.env.PORT || 3000;

server.listen(port, function() {
  // eslint-disable-next-line no-console
  console.log('Server running on port: %d', port);
});
