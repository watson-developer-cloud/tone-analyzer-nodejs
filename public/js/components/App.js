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
/* global normalize, move */
/* eslint no-unused-vars: "warn" */

/**
 * This is a JS constructor that controls this application's model and state
 * logic.
 * @param {Object} documentTones tone data at document level
 * @param {Array} sentences sentence tone array
 * @param {Object} thresholds threshold data
 * @param {String} selectedSample selected sample id
 * @param {Object} sentenceTones tone data at sentence level
 * @return {Object} exposed functions that interact with application state logic
 *
 */
function App(documentTones, sentences, thresholds, selectedSample, sentenceTones) { // eslint-disable-line no-unused-vars
  var _selectedFilter = 'No Tone',
    _lowToHigh = false,
    _currentHoveredOriginalSentence = document.querySelector('body'),
    _rankedSentences = sentences.slice(0),
    _originalSentences,
    _sentenceTones = sentenceTones,
    _thresholds = thresholds,
    _isHoveringOriginalText = false,
    _emotionToneHoverTexts,
    _emotionToneDescription,
    _toneHash,
    NO_TONE = {
      tone_id: 'no-tone',
      tone_name: 'No Tone'
    },
    ERROR_TONE = {
      tone_id: 'error',
      tone_name: 'Error'
    },
    DOCUMENT_TONE_DEFAULT = [{
      score: 0,
      tone_id: 'anger',
      tone_name: 'Anger'
    }, {
      score: 0,
      tone_id: 'fear',
      tone_name: 'Fear'
    }, {
      score: 0,
      tone_id: 'joy',
      tone_name: 'Joy'
    }, {
      score: 0,
      tone_id: 'sadness',
      tone_name: 'Sadness'
    }, {
      score: 0,
      tone_id: 'analytical',
      tone_name: 'Analytical'
    }, {
      score: 0,
      tone_id: 'confident',
      tone_name: 'Confident'
    }, {
      score: 0,
      tone_id: 'tentative',
      tone_name: 'Tentative'
    }],
    SCORE_DECIMAL_PLACE = 2,
    PERCENTAGE_DECIMAL_PLACE = 1,
    SOCIAL_TONE_MIN_RANGE = -1, // eslint-disable-line no-unused-vars
    SOCIAL_TONE_MAX_RANGE = 1, // eslint-disable-line no-unused-vars
    output = {};

  /**
   * Return the default value for document tones
   * @return {list}
   */
  output.getDocumentToneDefault = function() {
    return DOCUMENT_TONE_DEFAULT;
  };

  /**
   * Make sure sentences have proper tone data values.
   * Mutates _rankedSentences
   * @return {undefined}
   */

  function _cleanSentences() {
    // look for empty tones in sentences and set it to noTone
    _rankedSentences.forEach(function(item) {
      if (item.tones.length === 0) {
        item.tones = [{
          'score': 0,
          'tone_id': NO_TONE.tone_id,
          'tone_name': NO_TONE.tone_name
        }];
      }
    });
  }

  /**
   * Get index of a tone in the sentence object
   * @param {String} key tone name as key
   * @param {object} obj sentence object as obj
   * @return {int} index positioning of tone
   */
  function _searchIndexObject(key, obj) {
    var item = obj,
      i = 0,
      index;
    item.tones.forEach(function(element) {
      if (key == element.tone_name) {
        index = i;
      }
      ++i;
    });
    return index;
  }

  /**
   * This is a helper function to determine which classname to use by
   * comparing tone score with thresholds.
   * @param {String} toneKey tone name as key
   * @param {int} score score to evaluate
   * @param {String} classNameType class name type
   * @return {String} resulting class name
   */
  function _toneLevel(toneKey, score, classNameType) {
    var outputTone,
      toneValue = _toneHash[toneKey],
      newScore = score,
      baseThreshold = 0;
    //Assign class based on score, error or no-tone
    if (toneKey == ERROR_TONE.tone_name) {
      outputTone = 'original-text--sentence_' + normalize(ERROR_TONE.tone_name);
    } else if (toneKey == NO_TONE.tone_name) {
      outputTone = 'original-text--sentence_' + normalize(NO_TONE.tone_name);
    } else if (newScore <= baseThreshold) {
      outputTone = '';
    } else if (newScore < toneValue.low.score) {
      outputTone = toneValue.low[classNameType];
    } else if (newScore > toneValue.high.score) {
      outputTone = toneValue.high[classNameType];
    } else {
      outputTone = toneValue.medium[classNameType];
    }
    return outputTone;
  }

  /**
   * Percentagify
   * @param {float} score decimal score
   * @return {float} percentage score in PERCENTAGE_DECIMAL_PLACE placements
   */
  function _percentagify(score) {
    return parseFloat((score * 100).toFixed(PERCENTAGE_DECIMAL_PLACE));
  }

  /**
   * Getter / Setter for _selectedFilter
   * @param {String} str setter tone name
   * @return {String} _selectedFilter
   */
  output.selectedFilter = function(str) {
    if (!arguments.length) return _selectedFilter;
    if (str == null) str = NO_TONE.tone_name;
    _selectedFilter = str;
    return output;
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
   * @param {bool} bool setter boolean
   * @return {bool} (getter) {bool} _lowToHigh
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
   * @param {bool} bool setter boolean
   * @return {bool} (getter) _isHoveringOriginalText
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
   * @param {DOMElement} element setter element
   * @return {DOMElement} (getter)  _currentHoveredOriginalSentence
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
        var aIndex = _searchIndexObject(_selectedFilter, a),
          bIndex = _searchIndexObject(_selectedFilter, b),
          aScore = 0,
          bScore = 0;
        if (aIndex != null) aScore = a.tones[aIndex].score;
        if (bIndex != null) bScore = b.tones[bIndex].score;
        return aScore - bScore;
      } :
      function(a, b) {
        var aIndex = _searchIndexObject(_selectedFilter, a),
          bIndex = _searchIndexObject(_selectedFilter, b),
          aScore = 0,
          bScore = 0;
        if (aIndex != null) aScore = a.tones[aIndex].score;
        if (bIndex != null) bScore = b.tones[bIndex].score;

        return bScore - aScore;
      },
      map = function(item) {
        var itemIndex = _searchIndexObject(_selectedFilter, item),
          score = 0;
        if (itemIndex != null) score = item.tones[itemIndex].score.toFixed(SCORE_DECIMAL_PLACE);
        return {
          text: item.text,
          score: score,
          className: 'sentence-rank--score_' + normalize(_selectedFilter)
        };
      };
    return _rankedSentences.sort(sort).map(map);
  };

  /**
   * Export an adaptation of _originalSentences model
   * @return {Array} array of {Object} sentence data
   */
  output.updateOriginalSentences = function() {
    var map = function(item) {
      var result = item,
        tone_score, index;
      //If the tone was not present in the text, then assign it a score of 0
      index = _searchIndexObject(_selectedFilter, item);
      if (index == null) {
        tone_score = 0;
      } else {
        tone_score = item.tones[index].score;
      }

      if (ERROR_TONE.tone_id in item) {
        result.className = _toneLevel(ERROR_TONE.tone_name, tone_score, 'className_OT');
      } else {
        result.className = _toneLevel(_selectedFilter, tone_score, 'className_OT');
      }
      return result;
    };
    return _originalSentences.map(map);
  };

  /**
   * Export a the current tone description
   * return {String}
   */
  output.updateOriginalTextDescription = function() {
    return _toneHash[_selectedFilter].description;
  };

  /**
   * Export an adaptation of original sentences tooltip model
   * @param {int} sentenceIndex sentence index
   * @return {Array} array of {Object} sentence data
   */
  output.updateOriginalSentencesTooltips = function(sentenceIndex) {
    var map = function(item) {
      var result = item;
      result.className = 'original-text--tooltip-li_' + normalize(result.tone_name);

      //Assign score only if there a tone in sentence
      if (item.tone_name != NO_TONE.tone_name) {
        result.score_percentage = item.score.toFixed(SCORE_DECIMAL_PLACE);
      }
      if (ERROR_TONE.tone_id in _originalSentences[sentenceIndex]) {
        result.error = _originalSentences[sentenceIndex].error; //Text displayed in tooltip will be the error message
        result.className = 'original-text--tooltip-li_' + normalize(ERROR_TONE.tone_name);
      }

      return result;
    };

    return move(
      _originalSentences[sentenceIndex].tones.slice(0).map(map),
      _searchIndexObject(_selectedFilter, _originalSentences[sentenceIndex]), //_searchIndex(_selectedFilter),
      0);
  };

  /**
   * Select initial filter depending on sample text picked
   * @return {undefined}
   */
  output.selectFilterBySample = function() {
    var getHighestTone = function() {
      if (_sentenceTones.length == 0) {
        return NO_TONE.tone_name;
      }
      var highestTone = _sentenceTones[0].tone_name,
        highestScore = 0;
      _sentenceTones.forEach(function(item) {
        if (highestScore < item.score) {
          highestScore = item.score;
          highestTone = item.tone_name;
        }
      });
      return highestTone;
    };
    output.selectedFilter(getHighestTone());
  };

  /**
   * Expose {Function} _percentagify
   */
  output.percentagify = _percentagify;

  // cleaning and setting up everything
  _cleanSentences(_rankedSentences);
  _originalSentences = _rankedSentences.slice(0);

  _emotionToneHoverTexts = {
    'No Tone': '',
    'Anger': 'Likelihood of writer being perceived as angry. Low value indicates unlikely to be perceived as angry. High value indicates very likely to be perceived as angry. ',
    'Fear': 'Likelihood of writer being perceived as scared. Low value indicates unlikely to be perceived as fearful. High value, very likely to be perceived as scared.',
    'Joy': 'Joy or happiness has shades of enjoyment, satisfaction and pleasure. There is a sense of well-being, inner peace, love, safety and contentment.',
    'Sadness': 'Likelihood of writer being perceived as sad. Low value, unlikely to be perceived as sad. High value very likely to be perceived as sad.',
    'Analytical': 'A writer\'s reasoning and analytical attitude about things. Higher value, more likely to be perceived as intellectual, rational, systematic, emotionless, or impersonal.',
    'Confident': 'A writer\'s degree of certainty. Higher value, more likely to be perceived as assured, collected, hopeful, or egotistical.',
    'Tentative': 'A writer\'s degree of inhibition. Higher value, more likely to be perceived as questionable, doubtful, limited, or debatable.'
  };

  // Original Text Descriptions
  _emotionToneDescription = {
    'No Tone': '',
    'Anger': '<b>Anger:</b> Evoked due to injustice, conflict, humiliation, negligence or betrayal. If anger is active, the individual attacks the target, verbally or physically. If anger is passive, the person silently sulks and feels tension and hostility. ',
    'Fear': '<b>Fear:</b> A response to impending danger. It is a survival mechanism that is a reaction to some negative stimulus. It may be a mild caution or an extreme phobia.',
    'Joy': '<b>Joy:</b> Joy or happiness has shades of enjoyment, satisfaction and pleasure. There is a sense of well-being, inner peace, love, safety and contentment.',
    'Sadness': '<b>Sadness:</b> Indicates a feeling of loss and disadvantage. When a person can be observed to be quiet, less energetic and withdrawn, it may be inferred that sadness exists.',
    'Analytical': '<b>Analytical:</b> A person\'s reasoning and analytical attitude about things.',
    'Confident': '<b>Confident:</b> A person\'s degree of certainty.',
    'Tentative': '<b>Tentative:</b> A person\'s degree of inhibition.'
  };

  // Constructing the _toneHash hashmap
  _toneHash = DOCUMENT_TONE_DEFAULT.concat(NO_TONE).reduce(function(prevVal2, curVal2, curIndex2) {
    prevVal2[curVal2.tone_name] = {
      index: curIndex2,
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
    prevVal2[curVal2.tone_name].tooltip = _emotionToneHoverTexts[curVal2.tone_name];
    prevVal2[curVal2.tone_name].description = _emotionToneDescription[curVal2.tone_name];

    return prevVal2;
  }, {});

  return output;
}
