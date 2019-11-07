/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

require('dotenv').config({silent: true});

const express = require('express');
const app = express();
const ToneAnalyzerV3 = require('ibm-watson/tone-analyzer/v3');
const { IamAuthenticator } = require('ibm-watson/auth');

const toneAnalyzer = new ToneAnalyzerV3({
  version: '2019-10-10',
  authenticator: new IamAuthenticator({
    apikey: process.env.TONE_ANALYZER_IAM_APIKEY || 'type-key-here',
  }),
  url: process.env.TONE_ANALYZER_URL,
});

// Bootstrap application settings
require('./config/express')(app);

app.get('/', function(req, res) {
  res.render('index');
});

app.post('/api/tone', async function(req, res, next) {
  try {
    const { result } = await toneAnalyzer.tone(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// error-handler application settings
require('./config/error-handler')(app);

module.exports = app;
