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

var path = require('path');
// load default gitvariables for testing
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

var app = require('../../app');
var request = require('supertest');
var fs = require('fs');

//load data samples
var filePathTweets = path.join(__dirname, '../..', '/public/data/tweets.txt');
var sampleTextTweets = fs.readFileSync(filePathTweets, 'utf-8');

var filePathReview = path.join(__dirname, '../..', '/public/data/review.txt');
var sampleTextReview = fs.readFileSync(filePathReview, 'utf-8');

var filePathEmail = path.join(__dirname, '../..', '/public/data/personal-email.txt');
var sampleTextEmail = fs.readFileSync(filePathEmail, 'utf-8');

//Execute when credentials are set
if (process.env.TONE_ANALYZER_USERNAME && process.env.TONE_ANALYZER_USERNAME != '<username>') {

  describe('integration-express', function() {
    this.timeout(15000);

    it('Analyze tones in tweets sample', function() {
      return request(app).post('/api/tone')
        .type('form')
        .send({
          language: 'en',
          source_type: 'text',
          accept_language: 'en',
          include_raw: false,
          text: sampleTextTweets
        }).expect(200);
    });

    it('Analyze tones in reviews sample', function() {
      return request(app).post('/api/tone')
        .type('form')
        .send({
          language: 'en',
          source_type: 'text',
          accept_language: 'en',
          include_raw: false,
          text: sampleTextReview
        }).expect(200);
    });

    it('Analyze tones in email sample', function() {
      return request(app).post('/api/tone')
        .type('form')
        .send({
          language: 'en',
          source_type: 'text',
          accept_language: 'en',
          include_raw: false,
          text: sampleTextEmail
        }).expect(200);
    });

    it('Analyze tones in own text', function() {
      return request(app).post('/api/tone')
        .type('form')
        .send({
          language: 'en',
          source_type: 'text',
          accept_language: 'en',
          include_raw: false,
          text: 'This is a chair'
        }).expect(200);
    });

    it('Generate Error when there is no text for analysis', function() {
      return request(app).post('/api/tone')
        .type('form')
        .send({
          language: 'en',
          source_type: 'text',
          accept_language: 'en',
          include_raw: false,
          text: ''
        }).expect(500);
    });

    it('Analyze tones when only text is specified', function() {
      return request(app).post('/api/tone')
        .type('form')
        .send({
          text: sampleTextTweets
        }).expect(200);
    });

  });
}
