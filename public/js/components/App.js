/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* global $:false, normalize, move */

/**
 * This is a JS constructor that controls this application's model and state
 * logic.
 * @param {Object} document tone data
 * @param {Array} sentence tone array
 * @param {Object} threshold data
 * @param {String} selected sample id
 * @return {Object} exposed functions that interact with application state logic
 */
function App(documentTones, sentences, thresholds, selectedSample) {
  var _selectedFilter = 'Anger',
      _selectedTone = 'Emotion Tone',
      _selectedSample = selectedSample || 'customer-call',
      _lowToHigh = false,
      _currentHoveredOriginalSentence = document.querySelector('body'),
      _rankedSentences = sentences,
      _originalSentences,
      _documentTones = documentTones,
      _thresholds = thresholds,
      _isHoveringOriginalText = false,
      _socialToneHoverTexts,
      _toneHash,
      TONE_CATEGORIES_RESET = [{
        tones: [{
          score: 0,
          tone_id: 'Anger',
          tone_name: 'Anger',
          tone_category_id: 'emotion_tone',
          tone_category_name: 'Emotion Tone'
        }, {
          score: 0,
          tone_id: 'Disgust',
          tone_name: 'Disgust',
          tone_category_id: 'emotion_tone',
          tone_category_name: 'Emotion Tone'
        }, {
          score: 0,
          tone_id: 'Fear',
          tone_name: 'Fear',
          tone_category_id: 'emotion_tone',
          tone_category_name: 'Emotion Tone'
        }, {
          score: 0,
          tone_id: 'Joy',
          tone_name: 'Joy',
          tone_category_id: 'emotion_tone',
          tone_category_name: 'Emotion Tone'
        }, {
          score: 0,
          tone_id: 'Sadness',
          tone_name: 'Sadness',
          tone_category_id: 'emotion_tone',
          tone_category_name: 'Emotion Tone'
        }],
        category_id: 'emotion_tone',
        category_name: 'Emotion Tone'
      }, {
        tones: [{
          score: 0,
          tone_id: 'Analytical',
          tone_name: 'Analytical',
          tone_category_id: 'writing_tone',
          tone_category_name: 'Writing Tone'
        }, {
          score: 0,
          tone_id: 'Confident',
          tone_name: 'Confident',
          tone_category_id: 'writing_tone',
          tone_category_name: 'Writing Tone'
        }, {
          score: 0,
          tone_id: 'Tentative',
          tone_name: 'Tentative',
          tone_category_id: 'writing_tone',
          tone_category_name: 'Writing Tone'
        }],
        category_id: 'writing_tone',
        category_name: 'Writing Tone'
      }, {
        tones: [{
          score: 0,
          tone_id: 'Openness_Big5',
          tone_name: 'Openness',
          tone_category_id: 'social_tone',
          tone_category_name: 'Social Tone'
        }, {
          score: 0,
          tone_id: 'Conscientiousness_Big5',
          tone_name: 'Conscientiousness',
          tone_category_id: 'social_tone',
          tone_category_name: 'Social Tone'
        }, {
          score: 0,
          tone_id: 'Extraversion_Big5',
          tone_name: 'Extraversion',
          tone_category_id: 'social_tone',
          tone_category_name: 'Social Tone'
        }, {
          score: 0,
          tone_id: 'Agreeableness_Big5',
          tone_name: 'Agreeableness',
          tone_category_id: 'social_tone',
          tone_category_name: 'Social Tone'
        }, {
          score: 0,
          tone_id: 'Neuroticism_Big5',
          tone_name: 'Emotional Range',
          tone_category_id: 'social_tone',
          tone_category_name: 'Social Tone'
        }],
        category_id: 'social_tone',
        category_name: 'Social Tone'
      }],      SCORE_DECIMAL_PLACE = 2,
      PERCENTAGE_DECIMAL_PLACE = 1,
      SOCIAL_TONE_MIN_RANGE = -1,
      SOCIAL_TONE_MAX_RANGE = 1,
      output = {};

  /**
   * Make sure sentences have proper tone data values.
   * Mutates _rankedSentences
   */
  function _cleanSentences() {
    // look for empty tone_categories and set tone_categories to 0 values
    _rankedSentences.forEach(function(item) {
      if (item.tone_categories.length === 0)
        item.tone_categories = TONE_CATEGORIES_RESET.slice(0);
    });
  }

  /**
   * Get index of a tone
   * @param {String} tone name as key
   * @return {int} index positioning of tone
   */
  function _searchIndex(key) {
    return _toneHash[key].index;
  }

  /**
   * This is a helper function to determine which classname to use by
   * comparing tone score with thresholds.
   * @param {String} tone name as key
   * @param {int} tone score to evaluate
   * @param {String} class name type
   * @return {String} resulting class name
   */
  function _toneLevel(toneKey, score, classNameType) {
    var output,
        toneValue = _toneHash[toneKey],
        newScore = score,
        baseThreshold = 0;

    if (newScore <= baseThreshold)
      output = '';
    else if (newScore < toneValue.low.score)
      output = toneValue.low[classNameType];
    else if (newScore > toneValue.high.score)
      output = toneValue.high[classNameType];
    else
      output = toneValue.medium[classNameType];

    return output;
  }

  /**
   * Percentagify
   * @param {float} decimal score
   * @return {String} percentage score in PERCENTAGE_DECIMAL_PLACE placements
   */
  function _percentagify(score) {
    return (score * 100).toFixed(PERCENTAGE_DECIMAL_PLACE);
  }

  /**
   * Getter / Setter for _selectedFilter
   * Also sets _selectedTone appropriately
   * @param {String} setter tone name
   * @return (getter) {String} _selectedFilter
   * or
   * @return (setter) {Object} Constructor returned object
   */
  output.selectedFilter = function(str) {
    if (!arguments.length) return _selectedFilter;
    _selectedFilter = str;
    _selectedTone = _toneHash[_selectedFilter].tone;

    return output;
  };

  /**
   * Getter for _selectedTone
   * @return {String} _selectedTone
   */
  output.selectedTone = function() {
    return _selectedTone;
  };

  /**
   * Getter for _toneHash
   * @return {Object} _toneHash
   */
  output.toneHash = function() {
    return _toneHash;
  };

  /**
   * Getter / Setter for _lowToHigh
   * @param {bool} setter boolean
   * @return (getter) {bool} _lowToHigh
   * or
   * @return (setter) {Object} Constructor returned object
   */
  output.lowToHigh = function(bool) {
    if (!arguments.length) return _lowToHigh;
    _lowToHigh = bool;
    return output;
  };

  /**
   * Switch bool value of _lowToHigh
   * @return {Object} Constructor returned object
   */
  output.toggleLowToHigh = function() {
    _lowToHigh = !_lowToHigh;
    return output;
  };

  /**
   * Getter / Setter for _isHoveringOriginalText
   * @param {bool} setter boolean
   * @return (getter) {bool} _isHoveringOriginalText
   * or
   * @return (setter) {Object} Constructor returned object
   */
  output.isHoveringOriginalText = function(bool) {
    if (!arguments.length) return _isHoveringOriginalText;
    _isHoveringOriginalText = bool;
    return output;
  };

  /**
   * Getter for _thresholds
   * @return {Object} _thresholds
   */
  output.thresholds = function() {
    return _thresholds;
  };

  /**
   * Getter / Setter for _currentHoveredOriginalSentence
   * @param {DOMElement} setter element
   * @return (getter) {DOMElement} _currentHoveredOriginalSentence
   * or
   * @return (setter) {Object} Constructor returned object
   */
  output.currentHoveredOriginalSentence = function(element) {
    if (!arguments.length) return _currentHoveredOriginalSentence;
    _currentHoveredOriginalSentence = element;
    return output;
  };

  /**
   * Export an adaptation of _rankedSentences model
   * @return {Array} array of {Object} sentence data
   */
  output.updateRankedSentences = function() {
    var sort = _lowToHigh ?
          function(a, b) {
            return a.tone_categories[_searchIndex(_selectedTone)].tones[_searchIndex(_selectedFilter)].score
              - b.tone_categories[_searchIndex(_selectedTone)].tones[_searchIndex(_selectedFilter)].score;
          } :
          function(a, b) {
            return b.tone_categories[_searchIndex(_selectedTone)].tones[_searchIndex(_selectedFilter)].score
              - a.tone_categories[_searchIndex(_selectedTone)].tones[_searchIndex(_selectedFilter)].score;
          },
        map = function(item) {
          var score = item.tone_categories[_searchIndex(_selectedTone)].tones[_searchIndex(_selectedFilter)].score.toFixed(SCORE_DECIMAL_PLACE);
          return {
            text: item.text,
            score: score,
            className: 'sentence-rank--score_' + normalize(_selectedFilter)
          };
        },
        filter = (_selectedTone === 'Social Tone') ?
          function(item) {
            return item.score >= -1;
          } :
          function(item) {
            return item.score > 0;
          };
    return _rankedSentences.sort(sort).map(map);
  };

  /**
   * Export an adaptation of _originalSentences model
   * @return {Array} array of {Object} sentence data
   */
  output.updateOriginalSentences = function() {
    var map = function(item) {
      var result = item;
      result.className = _toneLevel(_selectedFilter, item.tone_categories[_searchIndex(_selectedTone)].tones[_searchIndex(_selectedFilter)].score, 'className_OT');
      result.text = result.text.replace(/\r?\n/g, '<br />');
      return result;
    };
    return _originalSentences.map(map);
  };

  /**
   * Export an adaptation of original sentences tooltip model
   * @param {int} sentence index
   * @return {Array} array of {Object} sentence data
   */
  output.updateOriginalSentencesTooltips = function(sentenceIndex) {
    var map = function(item) {
      var result = item;
      result.score_percentage = item.score.toFixed(SCORE_DECIMAL_PLACE);
      result.className = 'original-text--tooltip-li_' + normalize(result.tone_name);
      return result;
    };

    return move(
      _originalSentences[sentenceIndex].tone_categories[_searchIndex(_selectedTone)].tones.slice(0).map(map),
      _searchIndex(_selectedFilter),
      0);
  };

  /**
   * Select initial filter depending on sample text picked
   */
  output.selectFilterBySample = function() {
    var getHighestTone = function(toneCategory) {
      var highestTone = _documentTones.tone_categories[_searchIndex(toneCategory)].tones[0].tone_name,
          highestScore = 0;
      _documentTones.tone_categories[_searchIndex(toneCategory)].tones.forEach(function(item) {
        if (highestScore < item.score) {
          highestScore = item.score;
          highestTone = item.tone_name;
        }
      });
      return highestTone;
    },
    sample = {
      'customer-call': getHighestTone('Emotion Tone'),
      'email': getHighestTone('Social Tone'),
      'corporate-announcement': getHighestTone('Writing Tone'),
      'own-text': getHighestTone('Emotion Tone')
    };

    if (_selectedSample in sample)
      output.selectedFilter(sample[_selectedSample]);
  };

  /**
   * Expose {Function} _percentagify
   */
  output.percentagify = _percentagify;

  // cleaning and setting up everything
  _cleanSentences(_rankedSentences);
  _originalSentences = _rankedSentences.slice(0);
  _socialToneHoverTexts = {
    'Agreeableness': 'Higher: Tone of communication more likely to be perceived as caring, sympathetic, cooperative, compromising, trustworthy, and/or humble.<br><br>Lower: Tone more likely to be perceived as selfish, uncaring, uncooperative, self-interested, confrontational, skeptical, and/or arrogant.',
    'Emotional Range': '**This demo cannot diagnose a mental illness.** <br><br>Higher: Tone of communication more likely to be perceived as concerned, frustrated, angry, passionate, upset, stressed, insecure, or impulsive. Augments any Emotion Tones.<br><br>Lower: Tone more likely to be perceived as calm, bland, content, relaxed, unconcerned, or careful.',
    'Openness': 'Higher: Tone of communication more likely to be perceived as intellectual, curious, emotionally-aware, imaginative, willing to try new things, appreciating beauty, and/or open to change.<br><br>Lower: Tone more likely to be perceived as no-nonsense, straightforward, blunt, and/or preferring tradition and the obvious over the complex, ambiguous, and subtle.',
    'Conscientiousness': 'Higher: Tone of communication more likely to be perceived as disciplined, dutiful, achievement-striving, confident, driven, and/or organized.<br><br>Lower: Tone more likely to be perceived as spontaneous, laid-back, reckless, unmethodical, remiss, and/or disorganized.',
    'Extraversion': 'Higher: Tone of communication more likely to be perceived as engaging, seeking attention, needy, assertive, outgoing, sociable, cheerful, excitement-seeking, and/or busy.<br><br>Lower: Tone more likely to be perceived as independent, timid, introverted, restrained, boring, and/or dreary.'
  };

  // Constructing the _toneHash hashmap
  _toneHash = sentences[0].tone_categories.reduce(function(prevVal, curVal, curIndex) {
    prevVal = curVal.tones.reduce(function(prevVal2, curVal2, curIndex2) {
      prevVal2[curVal2.tone_name] = {
        index: curIndex2,
        tone: curVal.category_name,
        low: {
          score: _thresholds.sentence[curVal2.tone_name][0],
          className_OT: 'original-text--sentence_' + normalize(curVal2.tone_name) + '-low',
          className_SR: 'sentence-rank--score_' + normalize(curVal2.tone_name) + '-low'
        },
        medium: {
          className_OT: 'original-text--sentence_' + normalize(curVal2.tone_name) + '-medium',
          className_SR: 'sentence-rank--score_' + normalize(curVal2.tone_name) + '-medium'
        },
        high: {
          score: _thresholds.sentence[curVal2.tone_name][1],
          className_OT: 'original-text--sentence_' + normalize(curVal2.tone_name) + '-high',
          className_SR: 'sentence-rank--score_' + normalize(curVal2.tone_name) + '-high'
        }
      };

      if (curVal.category_name === 'Social Tone')
        prevVal2[curVal2.tone_name].tooltip = _socialToneHoverTexts[curVal2.tone_name];

      return prevVal2;
    }, prevVal);
    prevVal[curVal.category_name] = {
      index: curIndex,
      tone: curVal.category_name
    };
    return prevVal;
  }, {});

  return output;
}
