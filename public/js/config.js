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

var HIGHLIGHT_ANIMATION_DURATION = 500,
  TOP_N_WEIGHTED_POSITIVE_LIWC = 3,
  TOP_N_WEIGHTED_NEGATIVE_LIWC = 3,
  WORD_TRAIT_CORR_TYPE = {
    positive: 'positive',
    negative: 'negative'
  };

var COLOR_SCHEMA = {
  'emotion_tone': '#FF5003',
  'Anger': '#AD1625',
  'sadness': '#562f72',
  'anxiety': '#311a41',
  'Negative': '#d74108',
  'Cheerfulness': '#db2780',
  'writing_tone': '#5aa700',
  'causation': '#3690C0',
  'Analytical': '#4b8400',
  'Tentative': '#0a3c02',
  'insight': '#023858',
  'certainty': '#A6BDDB',
  'Confident': '#2d660A',
  'social_tone': '#5596e6',
  'family_c': '#a6d96a',
  'Conscientiousness_Big5': '#264a60',
  'friends': '#74c476',
  'Openness_Big5': '#4178be',
  'leisure': '#238b45',
  'Agreeableness_Big5': '#325c80',
  'refs_to_others': '#006d2c',
  'distant': '#006d2c'
};

var SAMPLE_TEXT = '' + 'Hi Team, \n\n' +
  'I know the times are difficult! Our sales have been disappointing for the past three quarters for our data analytics product suite. We have a competitive data analytics product suite in the industry. But we need to do our job selling it! \n\n' +
  'We need to acknowledge and fix our sales challenges. We can’t blame the economy for our lack of execution! We are missing critical sales opportunities. Our product  is in no way inferior to the competitor products. Our clients are hungry for analytical tools to improve their business outcomes. Economy has nothing to do with it. In fact, it is in times such as this, our clients want to get the insights they need to turn their businesses around. Let’s buckle up and execute. \n\n' +
  'In summary, we have a competitive product, and a hungry market. We have to do our job to close the deals.\n\n' +
  'Jennifer Baker\n' + 'Sales Leader, North-East Geo,\n' + 'Data Analytics Inc.';