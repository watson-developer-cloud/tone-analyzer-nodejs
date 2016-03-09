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

 /* global $:false, _, normalize, scrollTo, move, Application */

'use strict';
/*
 * JQuery on ready callback function
 */
function ready() {
  // load all json data first
  $.when(
    $.ajax('/data/threshold_v0.1.1.json'),
    $.ajax('/data/customer-call.txt'),
    $.ajax('/data/corporate-announcement.txt'),
    $.ajax('/data/personal-email.txt'))
    .done(function(thresholds, customerCall, corporateAnnouncement, personalEmail) {
      var sampleText = {
        'customer-call': customerCall[0],
        'corporate-announcement': corporateAnnouncement[0],
        'email': personalEmail[0],
        'own-text': ''
      };
      allReady(thresholds[0], sampleText);
    });
}

/**
 * Load application after initial json data is loaded
 * @param {Object} thresholds json
 * @param {Object} collection of sample text json
 */
function allReady(thresholds, sampleText) {
  var $input = $('.input'),
      $output = $('.output'),
      $loading = $('.loading'),
      $error = $('.error'),
      $errorMessage = $('.error--message'),
      $inputRadio = $('.input--radio'),
      $textarea = $('.input--textarea'),
      $submitButton = $('.input--submit-button'),
      $emotionGraph = $('.summary-emotion-graph'),
      $writingGraph = $('.summary-writing-graph'),
      $socialGraph = $('.summary-social-graph'),
      $emotionFilters = $('.filters--emotion'),
      $writingFilters = $('.filters--writing'),
      $socialFilters = $('.filters--social'),
      $originalText = $('.original-text'),
      $originalTexts = $('.original-text--texts'),
      $originalTextTooltipContainer = $('.original-text--tooltip-container'),
      $legend = $('.original-text--legend'),
      $sentenceRankTable = $('.sentence-rank--table'),
      $jsonCode = $('.json--code'),
      $outputResetButton = $('.output--reset-button'),
      barGraph_template = barGraphTemplate.innerHTML,
      verticalBarGraph_template = verticalBarGraphTemplate.innerHTML,
      filters_template = filtersTemplate.innerHTML,
      originalText_template = originalTextTemplate.innerHTML,
      sentenceRank_template = sentenceRankTemplate.innerHTML,
      originalTextTooltip_template = originalTextTooltipTemplate.innerHTML,
      originalTextLegend_template = originalTextLegendTemplate.innerHTML;

  /**
   * Callback function for AJAX post to get tone analyzer data
   * @param {Object} response data from api
   */
  function toneCallback(data) {

    $input.show();
    $loading.hide();
    $error.hide();
    $output.show();
    scrollTo($output);

    var emotionTone = data.document_tone.tone_categories[0].tones,
        writingTone = data.document_tone.tone_categories[1].tones,
        socialTone = data.document_tone.tone_categories[2].tones,
        selectedSample = $('input[name=rb]:checked').val(),
        selectedSampleText = $textarea.val(),
        sentences,
        app;

    // if only one sentence, sentences will not exist, so mutate sentences_tone manually
    if (data.sentences_tone === undefined) {
      data.sentences_tone = [{
        sentence_id: 0,
        text: selectedSampleText,
        tone_categories: data.document_tone.tone_categories
      }];
    }
    sentences = data.sentences_tone;
    app = new App(data.document_tone, sentences.slice(0), thresholds, selectedSample); // clone sentences

    /**
     * Map Callback function for emotion document tones
     * @param {Object} current iterating element
     * @return {Object} label, score, threshold
     */
    function emotionMap(item) {
      return {
        label: item.tone_name,
        score: app.percentagify(item.score, 'Emotion Tone'),
        thresholdLow: app.percentagify(app.thresholds().doc[item.tone_name][0]),
        thresholdHigh: app.percentagify(app.thresholds().doc[item.tone_name][1])
      };
    }

    /**
     * Map Callback function for writing document tones
     * @param {Object} current iterating element
     * @return {Object} label, score
     */
    function writingMap(item) {
      return {
        label: item.tone_name,
        score: app.percentagify(item.score, 'Writing Tone')
      };
    }

    /**
     * Map Callback function for social document tones
     * @param {Object} current iterating element
     * @return {Object} label, score, threshold percent, tooltip text
     */
    function socialMap(item) {
      return {
        label: item.tone_name,
        score: app.percentagify(item.score, 'Social Tone'),
        tooltip: app.toneHash()[item.tone_name].tooltip
      };
    }

    /**
     * Make sure height of sentences view is same as filters view
     */
    function matchSentenceViewsHeight() {
      $('.sentences--sentence-views').css('height', $('.sentences--filters')[0].getBoundingClientRect().height + 'px');
    }

    /**
     * Toggle sentence rank, Emit view update
     */
    function toggleSort() {
      app.toggleLowToHigh();
      updateSentenceRank();
    }

    /**
     * Select tone, Emit view update
     * @param {String} tone name
     */
    function clickFilter(tone_name) {
      app.selectedFilter(tone_name);
      updateOriginalText();
      updateSentenceRank();
      updateLegend();
    }

    /**
     * Select right filter
     */
    function updateFilters() {
      $('.filters--radio[data-id=' + app.selectedFilter() + ']').prop('checked', true);
    }

    /**
     * Emit view update for original text view
     */
    function updateOriginalText() {
      $originalTexts.html(_.template(originalText_template, {
        items: app.updateOriginalSentences()
      }));
    }

    /**
     * Emit view update for sentence rank view
     */
    function updateSentenceRank() {
      $sentenceRankTable.html(_.template(sentenceRank_template, {
        items: app.updateRankedSentences()
      }));
    }

    /**
     * Update original text tooltip positioning
     * @param {Object} event data object
     */
    function positionOriginalTextTooltip(e) {
      var element = app.currentHoveredOriginalSentence(),
          box = element.getBoundingClientRect(),
          originalText = document.querySelector('.original-text'),
          top = box.top,
          left = box.left + originalText.getBoundingClientRect().width * 0.05;

      if (e !== undefined)
        left = e.clientX;
      $originalTextTooltipContainer.css({
        'top': top,
        'left': left
      });
    }

    /**
     * Emit view update for original text tooltip view
     * @param {int} index of currently hovering original sentence element
     */
    function updateOriginalTextTooltip(index) {
      $originalTextTooltipContainer.html(_.template(originalTextTooltip_template, {
        items: app.updateOriginalSentencesTooltips(index),
        isSocialTone: app.selectedTone()
      }));
    }

    /**
     * Emit view update for legend view
     */
    function updateLegend() {
      $legend.html(_.template(originalTextLegend_template, {
        className: normalize(app.selectedFilter())
      }));
    }

    /**
     * Bind original text view hover events for original text tooltip
     * interactions
     */
    function bindOriginalTextHoverEvents() {
      $('.original-text--sentence-container').hover(function(e) {
        var id = $(this).data('index');
        app.currentHoveredOriginalSentence(this);
        updateOriginalTextTooltip(id);
        $originalTextTooltipContainer.removeClass('original-text--tooltip-container_hidden');
        app.isHoveringOriginalText(true);
        $('.original-text--sentence-container').not('[data-index="'+id+'"]').addClass('original-text--sentence-container_grayed');
      }, function(e) {
        $originalTextTooltipContainer.addClass('original-text--tooltip-container_hidden');
        app.isHoveringOriginalText(false);
        $('.original-text--sentence-container').removeClass('original-text--sentence-container_grayed');
      });

      $(document).scroll(function(e) {
        positionOriginalTextTooltip(e);
      });

      $originalText.scroll(function(e) {
        positionOriginalTextTooltip(e);
        if (app.isHoveringOriginalText())
          $originalTextTooltipContainer.addClass('original-text--tooltip-container_hidden');
      });

      $originalText.mousemove(function(e) {
        positionOriginalTextTooltip(e);
      });
    }

    /**
     * Emit view update for json view
     * @param {Object} data
     */
    function updateJSON(data) {
      $jsonCode.empty();
      $jsonCode.html(JSON.stringify(data, null, 2));
    }

    app.selectFilterBySample();

    emotionTone = emotionTone.map(emotionMap);
    writingTone = writingTone.map(writingMap);
    socialTone = socialTone.map(socialMap);

    $emotionGraph.html(_.template(barGraph_template, {
      items: emotionTone,
      className: 'emotion'
    }));

    $writingGraph.html(_.template(verticalBarGraph_template, {
      items: writingTone,
      className: 'writing'
    }));

    $socialGraph.html(_.template(barGraph_template, {
      items: socialTone,
      className: 'social'
    }));

    $emotionFilters.html(_.template(filters_template, {
      items: emotionTone
    }));

    $writingFilters.html(_.template(filters_template, {
      items: writingTone
    }));

    $socialFilters.html(_.template(filters_template, {
      items: socialTone
    }));

    updateFilters();
    matchSentenceViewsHeight();
    updateOriginalText();
    updateSentenceRank();
    updateLegend();
    bindOriginalTextHoverEvents();

    $jsonCode.html(JSON.stringify(data, null, 2));

    $('.filters--radio').on('click', function() {
      clickFilter($(this).data('id'));
      bindOriginalTextHoverEvents();
    });

    $('.sentence-rank--checkbox').on('change', function() {
      toggleSort();
    });
  }

  /**
   * AJAX Post request on error callback
   * @param {Object} error
   */
  function _error(error) {
    var message = typeof error.responseJSON.error === 'string' ?
      error.responseJSON.error :
      'Error code ' + error.responseJSON.error.code + ': ' + error.responseJSON.error.message;

    if (error.responseJSON.code === 429)
      message = 'You\'ve sent a lot of requests in a short amount of time. ' +
        'As the CPU cores cool off a bit, wait a few seonds before sending more requests.'
    $errorMessage.html(message);
    $input.show();
    $loading.hide();
    $output.hide();
    $error.show();
    scrollTo($error);
  }

  /**
   * AJAX Post request for tone analyzer api
   * @param {String} request body text
   */
  function getToneAnalysis(text) {
    $.post('/api/tone', {'text': text }, toneCallback)
      .fail(_error);
  }

  /**
   * Emit view update for input text area view
   * @param {String} sample text id
   */
  function updateTextarea(value) {
    $textarea.val(sampleText[value]);
  }

  /**
   * Reset views to beginning state
   */
  function reset() {
    $input.show();
    $loading.hide();
    $output.hide();
    $error.hide();
    scrollTo($input);
    $('#input-customer-call').trigger('click');
  }

  /**
   * Submit button click event
   */
  $submitButton.click(function() {
    $input.show();
    $loading.show();
    $output.hide();
    $error.hide();
    scrollTo($loading);
    getToneAnalysis($textarea.val());
  });

  /**
   * Input radio button click event
   */
  $inputRadio.click(function() {
    updateTextarea($(this).val());
  });

  /**
   * Reset button click event
   */
  $outputResetButton.click(function() {
    reset();
  });

  updateTextarea($('.input--radio:checked').val());
}

$(document).ready(ready);
