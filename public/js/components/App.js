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
 * @param {Object} documentTones tone data
 * @param {Array} sentences sentence tone array
 * @param {Object} thresholds threshold data
 * @param {String} selectedSample selected sample id
 * @return {Object} exposed functions that interact with application state logic
 *
 */
function App(documentTones, sentences, thresholds, selectedSample) { // eslint-disable-line no-unused-vars
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
    _languageToneHoverTexts,
    _emotionToneHoverTexts,
    _socialToneDescription,
    _languageToneDescription,
    _emotionToneDescription,
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
        tone_category_id: 'language_tone',
        tone_category_name: 'Language Tone'
      }, {
        score: 0,
        tone_id: 'Confident',
        tone_name: 'Confident',
        tone_category_id: 'language_tone',
        tone_category_name: 'Language Tone'
      }, {
        score: 0,
        tone_id: 'Tentative',
        tone_name: 'Tentative',
        tone_category_id: 'language_tone',
        tone_category_name: 'Language Tone'
      }],
      category_id: 'language_tone',
      category_name: 'Language Tone'
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
    SOCIAL_TONE_MIN_RANGE = -1, // eslint-disable-line no-unused-vars
    SOCIAL_TONE_MAX_RANGE = 1,  // eslint-disable-line no-unused-vars
    output = {};

  /**
   * Make sure sentences have proper tone data values.
   * Mutates _rankedSentences
   * @return {undefined}
   */
  function _cleanSentences() {
    // look for empty tone_categories and set tone_categories to 0 values
    _rankedSentences.forEach(function (item) {
      if (item.tone_categories.length === 0) {
        item.tone_categories = TONE_CATEGORIES_RESET.slice(0);
      }
    });
  }

  /**
   * Get index of a tone
   * @param {String} key tone name as key
   * @return {int} index positioning of tone
   */
  function _searchIndex(key) {
    return _toneHash[key].index;
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

    if (newScore <= baseThreshold) {
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
   * Also sets _selectedTone appropriately
   * @param {String} str setter tone name
   * @return {String} _selectedFilter
   */
  output.selectedFilter = function (str) {
    if (!arguments.length) return _selectedFilter;
    _selectedFilter = str;
    _selectedTone = _toneHash[_selectedFilter].tone;

    return output;
  };

  /**
   * Getter for _selectedTone
   * @return {String} _selectedTone
   */
  output.selectedTone = function () {
    return _selectedTone;
  };

  /**
   * Getter for _toneHash
   * @return {Object} _toneHash
   */
  output.toneHash = function () {
    return _toneHash;
  };

  /**
   * Getter / Setter for _lowToHigh
   * @param {bool} bool setter boolean
   * @return {bool} (getter) {bool} _lowToHigh
   */
  output.lowToHigh = function (bool) {
    if (!arguments.length) return _lowToHigh;
    _lowToHigh = bool;
    return output;
  };

  /**
   * Switch bool value of _lowToHigh
   * @return {Object} Constructor returned object
   */
  output.toggleLowToHigh = function () {
    _lowToHigh = !_lowToHigh;
    return output;
  };

  /**
   * Getter / Setter for _isHoveringOriginalText
   * @param {bool} bool setter boolean
   * @return {bool} (getter) _isHoveringOriginalText
   */
  output.isHoveringOriginalText = function (bool) {
    if (!arguments.length) return _isHoveringOriginalText;
    _isHoveringOriginalText = bool;
    return output;
  };

  /**
   * Getter for _thresholds
   * @return {Object} _thresholds
   */
  output.thresholds = function () {
    return _thresholds;
  };

  /**
   * Getter / Setter for _currentHoveredOriginalSentence
   * @param {DOMElement} element setter element
   * @return {DOMElement} (getter)  _currentHoveredOriginalSentence
   */
  output.currentHoveredOriginalSentence = function (element) {
    if (!arguments.length) return _currentHoveredOriginalSentence;
    _currentHoveredOriginalSentence = element;
    return output;
  };

  /**
   * Export an adaptation of _rankedSentences model
   * @return {Array} array of {Object} sentence data
   */
  output.updateRankedSentences = function () {
    var sort = _lowToHigh ?
          function (a, b) {
            return a.tone_categories[_searchIndex(_selectedTone)].tones[_searchIndex(_selectedFilter)].score
              - b.tone_categories[_searchIndex(_selectedTone)].tones[_searchIndex(_selectedFilter)].score;
          } :
          function(a, b) {
            return b.tone_categories[_searchIndex(_selectedTone)].tones[_searchIndex(_selectedFilter)].score
              - a.tone_categories[_searchIndex(_selectedTone)].tones[_searchIndex(_selectedFilter)].score;
          },
      map = function (item) {
        var score = item.tone_categories[_searchIndex(_selectedTone)].tones[_searchIndex(_selectedFilter)].score.toFixed(SCORE_DECIMAL_PLACE);
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
    var map = function (item) {
      var result = item;
      result.className = _toneLevel(_selectedFilter, item.tone_categories[_searchIndex(_selectedTone)].tones[_searchIndex(_selectedFilter)].score, 'className_OT');
      return result;
    };
    return _originalSentences.map(map);
  };

  /**
   * Export a the current tone description
   * return {String}
   */
  output.updateOriginalTextDescription = function () {
    return _toneHash[_selectedFilter].description;
  };

  /**
   * Export an adaptation of original sentences tooltip model
   * @param {int} sentenceIndex sentence index
   * @return {Array} array of {Object} sentence data
   */
  output.updateOriginalSentencesTooltips = function (sentenceIndex) {
    var map = function (item) {
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
   * @return {undefined}
   */
  output.selectFilterBySample = function () {
    var getHighestTone = function (toneCategory) {
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
        'corporate-announcement': getHighestTone('Language Tone'),
        'own-text': getHighestTone('Emotion Tone')
      };

    if (_selectedSample in sample) {
      output.selectedFilter(sample[_selectedSample]);
    }
  };

  /**
   * Expose {Function} _percentagify
   */
  output.percentagify = _percentagify;

  // cleaning and setting up everything
  _cleanSentences(_rankedSentences);
  _originalSentences = _rankedSentences.slice(0);
  _socialToneHoverTexts = {
    'Agreeableness': 'Higher value, writer more likely to be perceived as, compassionate and cooperative towards others.',
    'Emotional Range': 'Higher value, writer likely to be perceived as someone sensitive to the environment.',
    'Openness': 'Higher value, writer more likely to be perceived as open to experiences for a variety of activities.',
    'Conscientiousness': 'Higher value, the writer likely to be percieved as someone who would act in an organized or thoughtful way.',
    'Extraversion': 'Higher value, the writer is likely to be perceived as someone who would seek stimulation in the company of others.'
  };

  _languageToneHoverTexts = {
    'Analytical': 'A writer\'s reasoning and analytical attitude about things. Higher value, more likely to be perceived as intellectual, rational, systematic, emotionless, or impersonal.',
    'Confident': 'A writer\'s degree of certainty. Higher value, more likely to be perceived as assured, collected, hopeful, or egotistical.',
    'Tentative': 'A writer\'s degree of inhibition. Higher value, more likely to be perceived as questionable, doubtful, limited, or debatable.'
  };

  _emotionToneHoverTexts = {
    'Anger': 'Likelihood of writer being perceived as angry. Low value indicates unlikely to be perceived as angry. High value indicates very likely to be perceived as angry. ',
    'Disgust': 'Likelihood of writer being perceived as disgusted. Low value, unlikely to be perceived as disgusted. High value, very likely to be perceived as disgusted.',
    'Fear': 'Likelihood of writer being perceived as scared. Low value indicates unlikely to be perceived as fearful. High value, very likely to be perceived as scared.',
    'Joy': 'Joy or happiness has shades of enjoyment, satisfaction and pleasure. There is a sense of well-being, inner peace, love, safety and contentment.',
    'Sadness': 'Likelihood of writer being perceived as sad. Low value, unlikely to be perceived as sad. High value very likely to be perceived as sad.'
  };
 
  // Original Text Descriptions
  _socialToneDescription = {
    'Agreeableness': '<b>Agreeableness:</b> The tendency to be compassionate and cooperative towards others.',
    'Emotional Range': '<b>Emotional Range:</b> The extent a persona\'s emotion is sensitive to the environment.	',
    'Openness': '<b>Openness:</b> The extent a person is open to experience a variety of activities.',
    'Conscientiousness': '<b>Conscientiousness:</b> The tendency to act in an organized or thoughtful way.',
    'Extraversion': '<b>Extraversion:</b> The tendency to seek stimulation in the company of others.'
  };

  _languageToneDescription = {
    'Analytical': '<b>Analytical:</b> A person\'s reasoning and analytical attitude about things.',
    'Confident': '<b>Confident:</b> A person\'s degree of certainty.',
    'Tentative': '<b>Tentative:</b> A person\'s degree of inhibition.'
  };

  _emotionToneDescription = {
    'Anger': '<b>Anger:</b> Evoked due to injustice, conflict, humiliation, negligence or betrayal. If anger is active, the individual attacks the target, verbally or physically. If anger is passive, the person silently sulks and feels tension and hostility. ',
    'Disgust': '<b>Disgust:</b> An emotional response of revulsion to something considered offensive or unpleasant. It is a sensation that refers to something revolting.',
    'Fear': '<b>Fear:</b> A response to impending danger. It is a survival mechanism that is a reaction to some negative stimulus. It may be a mild caution or an extreme phobia.',
    'Joy': '<b>Joy:</b> Joy or happiness has shades of enjoyment, satisfaction and pleasure. There is a sense of well-being, inner peace, love, safety and contentment.',
    'Sadness': '<b>Sadness:</b> Indicates a feeling of loss and disadvantage. When a person can be observed to be quiet, less energetic and withdrawn, it may be inferred that sadness exists.'
  };

  // Constructing the _toneHash hashmap
  _toneHash = sentences[0].tone_categories.reduce(function (prevVal, curVal, curIndex) {
    var reducedPrevVal = curVal.tones.reduce(function (prevVal2, curVal2, curIndex2) {
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

      if (curVal.category_name === 'Social Tone') {
        prevVal2[curVal2.tone_name].tooltip = _socialToneHoverTexts[curVal2.tone_name];
        prevVal2[curVal2.tone_name].description = _socialToneDescription[curVal2.tone_name];
      }

      if (curVal.category_name === 'Language Tone') {
        prevVal2[curVal2.tone_name].tooltip = _languageToneHoverTexts[curVal2.tone_name];
        prevVal2[curVal2.tone_name].description = _languageToneDescription[curVal2.tone_name];
      }
      if (curVal.category_name === 'Emotion Tone') {
        prevVal2[curVal2.tone_name].tooltip = _emotionToneHoverTexts[curVal2.tone_name];
        prevVal2[curVal2.tone_name].description = _emotionToneDescription[curVal2.tone_name];
      }
      return prevVal2;
    }, prevVal);
    reducedPrevVal[curVal.category_name] = {
      index: curIndex,
      tone: curVal.category_name
    };
    return reducedPrevVal;
  }, {});

  return output;
}
