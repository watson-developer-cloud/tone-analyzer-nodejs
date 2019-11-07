const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const request = require('supertest');
const fs = require('fs');

//load data samples
const filePathTweets = path.join(__dirname, '../..', '/public/data/tweets.txt');
const sampleTextTweets = fs.readFileSync(filePathTweets, 'utf-8');

const filePathReview = path.join(__dirname, '../..', '/public/data/review.txt');
const sampleTextReview = fs.readFileSync(filePathReview, 'utf-8');

const filePathEmail = path.join(__dirname, '../..', '/public/data/personal-email.txt');
const sampleTextEmail = fs.readFileSync(filePathEmail, 'utf-8');

const describeIfSkip =
  process.env.TONE_ANALYZER_IAM_APIKEY || process.env.TONE_ANALYZER_USERNAME
    ? describe
    : describe.skip;
describeIfSkip('integration-express', function() {
  jest.setTimeout(15000);
  const app = require('../../app');

  test('Analyze tones in tweets sample', () =>
    request(app)
      .post('/api/tone')
      .type('form')
      .send({
        contentLanguage: 'en',
        toneInput: {
          text: sampleTextTweets,
        },
      })
      .then(response => {
        expect(response.statusCode).toBe(200);
      }));

  test('Analyze tones in reviews sample', () =>
    request(app)
      .post('/api/tone')
      .type('form')
      .send({
        acceptLanguage: 'en',
        contentLanguage: 'en',
        toneInput: {
          text: sampleTextReview,
        },
      })
      .then(response => {
        expect(response.statusCode).toBe(200);
      }));

  test('Analyze tones in email sample', () =>
    request(app)
      .post('/api/tone')
      .type('form')
      .send({
        acceptLanguage: 'en',
        contentLanguage: 'en',
        toneInput: {
          text: sampleTextEmail,
        },
      })
      .then(response => {
        expect(response.statusCode).toBe(200);
      }));

});
