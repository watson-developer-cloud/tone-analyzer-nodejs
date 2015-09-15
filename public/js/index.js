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

/* global
  SAMPLE_TEXT:false, umviz:false, d3:false, $:false,
  WORD_TRAIT_CORR_TYPE:false, HIGHLIGHT_ANIMATION_DURATION:false,
  COLOR_SCHEMA:false
*/

'use strict';

// DOM id for the tone visualization
var vizId = '#visualization';

/** @type {d3.map()} global word - category mapping data structure for highlighting interaction */
var WORD_TO_CATEGORY = d3.map(),
  CATEGORY_TO_WORD = d3.map();

var SYNONYM_HOPS = 1,
  SYNONYM_LIMITS = 6;

// Visualization
var toneGenomeViz = new umviz.models.toneGenome()
  .width(880)
  .height(190)
  .margin({ top: -15, right: 50, bottom: 100, left: 45 })
  .layoutMetric('percentile')
  .colorSchema(COLOR_SCHEMA);

// Visualization container
var mainViz = d3.select(vizId)
  .append('div')
  .classed('svg-container', true) //container class to make it responsive
  .append('svg')
  .attr('preserveAspectRatio', 'xMinYMin meet')
  //responsive SVG needs these 2 attributes and no width and height attr
  .attr('viewBox', '0 0 '+ toneGenomeViz.width() + ' ' + toneGenomeViz.height())
  //class to make it responsive
  .classed('svg-content-responsive', true);

// startup
$(document).ready(function() {
  var $text     = $('#textArea'),
    $loading    = $('#loading'),
    $analyzeBtn = $('.analyze-btn'),
    $results    = $('.results'),
    $jsonTab    = $('.json-div'),
    $outputText = $('.text-output-div'),
    $outputTextLabel = $('.text-output-label'),
    $error      = $('.error'),
    $errorMsg   = $('.errorMsg'),
    $visualization = $(vizId);

  var CURRENT_TEXT = null; // current analyzed text
  var CURRENT_TONE = null; // current results
  var REPLACEABLE = null;

  // set initial text
  $text.val(SAMPLE_TEXT);

  function onAPIError(xhr) {
    var error;
    try {
      error = JSON.parse(xhr.responseText || {});
    } catch(e) {}

    showError(error ? (error.error || error): '');
  }

  $analyzeBtn.click(function() {
    $loading.show();
    $results.hide();

    /**
     * send the data to the Tone Analyzer API to get words
     * matched with LIWC categories;
     */
    var text = $text.val();
    
    $('.output-div')[0].scrollIntoView(true); // Boolean arguments

    $.post('/tone', {'text': text })
      .done(function(response) {
        // save the json response in the JSON tab
        $jsonTab.html(JSON.stringify(response, null, 2));

        //prepare the data
        processData(response);
        response.id = 'root';
        CURRENT_TONE = response;
        doToneCheck(response, text);
      })
      .fail(onAPIError)
      .always (function(){
        $loading.hide();
        // scroll to bottom
        $('.output-div')[0].scrollIntoView(true); // Boolean arguments

      });
  });

  /**
   * Display an error or a default message
   * @param  {String} error The error
   */
  function showError(error) {
    var defaultErrorMsg = 'Error processing the request, please try again later.';
    $error.show();
    $errorMsg.text(error || defaultErrorMsg);
  }

  /**
   * Updates the visualization with the tone analyzer results
   *
   * @param  {Object} toneResponse: tone scores with linguistic evidence
   * @param  {String} analyzedText: analyzed text
   */
  function doToneCheck(toneResponse, analyzedText) {
    // If the list of words with any synonym in the system is available, keep it
    if (toneResponse.replaceable_words) {
      REPLACEABLE = {}; 
      toneResponse.replaceable_words.forEach(function(w) {
        REPLACEABLE[w.toLowerCase()] = true;
      });
    } else {
      REPLACEABLE = null; 
    }
    $results.show();

    CURRENT_TEXT = analyzedText;
    // normalize text
    var analyzedHtmlText = analyzedText.replace(/\r\n/g, '<br />').replace(/[\r\n]/g, '<br />');

    // call visualization component

    mainViz.datum(toneResponse).call(toneGenomeViz);

    // add higlight span html tags for all matched words:
    WORD_TO_CATEGORY.keys().forEach(function(wd) {
      var cates = WORD_TO_CATEGORY.get(wd);
      if (cates !== undefined && cates instanceof Array)
          analyzedHtmlText = addPropertySpan(analyzedHtmlText, wd, cates.join(' '));
    });


    $outputText.html(analyzedHtmlText);

    //add highlight css for different categories
    CATEGORY_TO_WORD.keys().reverse().forEach(function(ele) {
      var cateName;
      if (ele.indexOf('_' + WORD_TRAIT_CORR_TYPE.positive) > 0)
        cateName = ele.substring(0, ele.indexOf('_' + WORD_TRAIT_CORR_TYPE.positive));
      if (ele.indexOf('_' + WORD_TRAIT_CORR_TYPE.negative) > 0)
        cateName = ele.substring(0, ele.indexOf('_' + WORD_TRAIT_CORR_TYPE.negative));

      $('.' + ele).css('color', COLOR_SCHEMA[cateName]);
      $('.' + ele).css('border', "1px solid "+COLOR_SCHEMA[cateName]);
      $('.' + ele).css('padding', '0.2em 0.5em 0.2em 0.5em');
      $('.' + ele + ".replaceable").css('background-color', COLOR_SCHEMA[cateName]);
      $('.' + ele + ".replaceable").css('color', 'white');
    });

    $('.matched-word').mouseover(function() {
      highlightToneGenome($(this).attr('categories'));
    });

    $('.matched-word').mouseout(function() {
      unhighlightToneGenome($(this).attr('categories'));
    });

    setupSynonymExpansion();
  }


  function addPropertySpan(data, search, stylecls) {
    var searchRgp = new RegExp('\\b(' + (search) + ')\\b', 'gi');
    var match, matchIdxs = []; //store matches in the original text.
    var counter = -1;

    while ((match = searchRgp.exec(CURRENT_TEXT)) !== null) {
      matchIdxs.push(match.index);
    }

    function replacer(matchstr) {
      counter++;
      var replaceable = REPLACEABLE && REPLACEABLE[matchstr.toLowerCase()];
      //console.log("replacer", matchstr, replaceable);
      return '<span class="matched-word ' + (replaceable ? 'replaceable ' : '') + stylecls + '" categories="' +
        stylecls + '" offset = "' + matchIdxs[counter] + '">' + matchstr + '</span>';
    }

    return data.replace(searchRgp, replacer);
  }

  /**
   * A function to get the context (array and idx) of a word in a text
   * @param  {String} word  the word to search
   * @param  {int} offset
   * @return {Object}       context array and offset
   */
  function getContext(word, offset) {
    var result = { context: [], offset: -1 },
      data = CURRENT_TEXT,
      pref = [],
      suf = [],
      contextHops = 2;

    //a reg exp alphanumeric, space or tab
    var charWithSpaceReg = /[\w\s\t]/i,
      wordBreakerReg = /[\s\t]/i;

    if (data !== null && data.length > 1) {
      var token = '';
      var counter = 0;
      var c = 0;
      //search prefix context:
      if (offset > 0) {
        var i = offset - 1;
        counter = 0;
        c = data.charAt(i);
        while (i >= 0 && counter < contextHops && (charWithSpaceReg.exec(c) !== null)) {
          if (wordBreakerReg.exec(c) !== null && token.length > 0) {
            pref.unshift(token);
            counter++;
            token = '';
          }
          if (wordBreakerReg.exec(c) === null) token = c + token;
          c = data.charAt(--i);
        }
      }
      token = '';
      //serarch suffix context:
      if (offset < (data.length - word.length)) {
        var j = parseInt(offset) + parseInt(word.length);
        counter = 0;
        c = data.charAt(j);
        while (j <= (data.length - 1) &&
          counter < contextHops &&
          (charWithSpaceReg.exec(c) !== null)) {

          if (wordBreakerReg.exec(c) !== null && token.length > 0) {
            suf.push(token);
            counter++;
            token = '';
          }
          if (wordBreakerReg.exec(c) === null) token = token.concat(c);
          c = data.charAt(++j);
        }
      }
    }

    if (pref.length > 0 || suf.length > 0)
      result.context = pref.concat([word], suf);
    result.offset = pref.length;

    return result;
  }

  function setupSynonymExpansion() {
    // on synonym word click
    $('.matched-word').click(function(event) {
      var _this = $(this);
      var cates = _this.attr('categories'),
        offset = _this.attr('offset'),
        word = _this.html().toLowerCase();

      if ($(this).hasClass('suggested')) {
        event.preventDefault();
        _this.popover('disable');
        return;
      }

      word = (word === 'challenges' ? 'challenge' : word);

      //clean other pop-ups
      $('.pop').popover('hide')
        .removeClass('pop');
      //get the context of this word:
      var cntxt = getContext(word, offset);

      $.ajax({
        type: 'GET',
        data: {
          word: word,
          limit: SYNONYM_LIMITS,
          context: cntxt.context.join(' '),
          index: cntxt.offset, 
          hops: SYNONYM_HOPS
        },
        url: 'synonyms',
        dataType: 'json',
        contentType: 'application/json',
        success: function(response) {
          $error.hide();
          processSynonym(response, cates);
        },
        error: onAPIError
      });

      function processSynonym(response, cates) {
        var allSyns = response.synonyms;
        var $synonymTab   = $('#synonymTabs'),
          $synonymContent = $('#synonymTabContent');

        //clean the content first:
        $synonymContent.empty();
        $synonymTab.empty();


        //get synonym list for current categories
        var curTraitSyns = [];
        allSyns.forEach(function(e) {
          if (cates.toLowerCase().indexOf(e.trait.toLowerCase()) >= 0) curTraitSyns.push(e);
        });

        if (!curTraitSyns.length) {
          _this.popover({
            title: '<p>No synonyms available for ' + '<strong>' + word + '</strong></p>',
            placement: 'bottom',
            content: $('#synonymDiv').html(),
            html:true,
          });

          //show the popover
          _this.popover('show').addClass('pop');

          $('#closePopover').click(function() {
            _this.popover('hide')
              .removeClass('pop');
          });

          $('.popover')[0].scrollIntoView();
          return;
        }

        curTraitSyns.forEach(function(ele) {
          var existingSyns = [],
            tabNaviTempl = '<li role="presentation"><a href="#TRAIT_ID_TO_REPLACE" aria-controls="TRAIT_ID_TO_REPLACE" role="tab" data-toggle="tab">TRAIT_ID_TO_REPLACE</a></li>',
            tabContentTempl = '<div role="tabpanel" class="tab-pane" id="TRAIT_ID_TO_REPLACE">TAB_CONTENT_TO_REPLACE</div>';

          //generate tab nav
          $synonymTab.append(tabNaviTempl.replace(/TRAIT_ID_TO_REPLACE/g, ele.trait));

          //generate tab content
          var synsListTempl = '<div class="list-group">LIST_CONTENT_TO_REPLACE</div>',
            synsListItemTempl = '<a class="list-group-item synonym-list-item" > <span class="badge badge-hidden">SYNONYM_WEIGHT</span>SYNONYM_CONTENT</a>',
            synsListItemContent = '',
            synsListGroup = '';

          ele.synonyms.forEach(function(syn) {
            if (existingSyns.indexOf(syn.word) < 0) {
              existingSyns.push(syn.word);
              synsListItemContent += synsListItemTempl
                .replace(/SYNONYM_CONTENT/g, syn.word)
                .replace(/SYNONYM_WEIGHT/g, syn.weight.toFixed(2));
            }
          });

          synsListGroup = synsListTempl.replace(/LIST_CONTENT_TO_REPLACE/g, synsListItemContent);

          $synonymContent.append(tabContentTempl
            .replace(/TRAIT_ID_TO_REPLACE/g, ele.trait)
            .replace(/TAB_CONTENT_TO_REPLACE/g, synsListGroup));
        });

        _this.popover({
          html: true,
          title: '<p>Suggested synonyms for ' + '<strong>' + word + '</strong> :</p>',
          content: $('#synonymDiv').html(),
          placement: 'bottom'
        });
        //show the popover
        _this.popover('show').addClass('pop');
        //show the first tab by default
        $('#synonymTabs a:first').tab('show');

        $('.badge').each(function() {
          if (parseFloat($(this).html()) < 0) $(this).attr('class', 'badge badge-hidden badge-neg');
        });

        $('.synonym-list-item').click(function() {
          var synSelected = $(this).clone() //clone the element
            .children() //select all the children
            .remove() //remove all the children
            .end() //again go back to selected element
            .text();
          $('div.modal-body').html('Are you sure you want to replace <strong>' + word +
            '</strong> with <strong>' + synSelected +
            '</strong>?');

          $('#useSynModal').modal('show');
          $('#confirmUseSyn').click(function() {
            $('#useSynModal').modal('hide');
            _this.attr('orgWord', word);
            _this.css('background-color', '#ddd');
            _this.css('color', 'black');
            _this.addClass('suggested');
            _this.html(synSelected);
            _this.popover('hide').removeClass('pop');
          });

        });

        _this[0].scrollIntoView();

        $('#closePopover').click(function() {
          _this.popover('hide')
            .removeClass('pop');
        });
      } //processSynonym
    });
  }

  function highlightToneGenome(_cates) {
    var trait_cates = _cates.trim().split(' ');

    d3.select(vizId).selectAll('.g-block')
      .filter(function(sel) {
        // not in both positive(WORD_TRAIT_CORR_TYPE.positive) or
        // negative(WORD_TRAIT_CORR_TYPE.negative) categories
        return ($.inArray(sel.id + '_' + WORD_TRAIT_CORR_TYPE.positive, trait_cates) === -1) &&
        ($.inArray(sel.id + '_' + WORD_TRAIT_CORR_TYPE.negative, trait_cates) === -1) ? true : false;
      })
    .transition()
      .duration(HIGHLIGHT_ANIMATION_DURATION)
      .style('opacity', 0.1);

    d3.select(vizId).selectAll('.g-block-mixed-child')
      .filter(function(sel) {
        var _this = d3.select(this);

        if (($.inArray(sel.id + '_' + WORD_TRAIT_CORR_TYPE.negative, trait_cates) !== -1) &&
          (_this.attr('corr') === WORD_TRAIT_CORR_TYPE.negative)) return false;

        if (($.inArray(sel.id + '_' + WORD_TRAIT_CORR_TYPE.positive, trait_cates) !== -1) &&
          (_this.attr('corr') === WORD_TRAIT_CORR_TYPE.positive)) return false;

        return true;
      })

    .transition()
      .duration(HIGHLIGHT_ANIMATION_DURATION)
      .style('opacity', 0.1);
  }

  function unhighlightToneGenome() {
    d3.select(vizId).selectAll('.g-block')
      .transition()
      .duration(HIGHLIGHT_ANIMATION_DURATION)
      .style('opacity', 1);
    d3.select(vizId).selectAll('.g-block-mixed-child')
      .transition()
      .duration(HIGHLIGHT_ANIMATION_DURATION)
      .style('opacity', 1);
  }

  function processData(traits) {
    if (traits.children === undefined) {
      //leaf node
      traits.mixedNode = traits.linguistic_evidence.length > 1 ? true : false;

      //use the score to calculate layout
      traits.linguistic_evidence.forEach(function(el) {

        if (el.correlation === WORD_TRAIT_CORR_TYPE.positive) {
          //extract trait-word mapping
          CATEGORY_TO_WORD.set(traits.id + '_' + WORD_TRAIT_CORR_TYPE.positive, el.words);
          //extract word-trait mapping
          if (el.words) {
            el.words.forEach(function(w) {
              var curCates = WORD_TO_CATEGORY.get(w);
              if (curCates === undefined)
                WORD_TO_CATEGORY.set(w, [traits.id + '_' + WORD_TRAIT_CORR_TYPE.positive]);
              else if ($.inArray(traits.id + '_' + WORD_TRAIT_CORR_TYPE.positive, curCates) === -1) {
                //not existing
                curCates.push(traits.id + '_' + WORD_TRAIT_CORR_TYPE.positive);
                WORD_TO_CATEGORY.set(w, curCates);
              }
            });
          }
        }

        if (el.correlation === WORD_TRAIT_CORR_TYPE.negative) {
          //extract trait-word mapping
          CATEGORY_TO_WORD.set(traits.id + '_' + WORD_TRAIT_CORR_TYPE.negative, el.words);
          //extract word-trait mapping
          el.words.forEach(function(w) {
            var curCates = WORD_TO_CATEGORY.get(w);
            if (curCates === undefined)
              WORD_TO_CATEGORY.set(w, [traits.id + '_' + WORD_TRAIT_CORR_TYPE.negative]);
            else
            if ($.inArray(traits.id + '_' + WORD_TRAIT_CORR_TYPE.negative, curCates) === -1) {
              //not existing
              curCates.push(traits.id + '_' + WORD_TRAIT_CORR_TYPE.negative);
              WORD_TO_CATEGORY.set(w, curCates);
            }
          });
        }
      });
    } else {
      //recursive do the data process
      traits.children.forEach(processData);
    }
  }

  $('.metric-count').click(function setMetricCount() {
    toneGenomeViz.layoutMetric('count');
    mainViz.datum(CURRENT_TONE).call(toneGenomeViz);
  });

  $('.metric-percentile').click(function setMetricPercentile() {
    toneGenomeViz.layoutMetric('percentile');
    mainViz.datum(CURRENT_TONE).call(toneGenomeViz);
  });

  $('.nav-tabs a').click(function() {
    setTimeout(function() {
      if ($('#json').hasClass('active')) {
        $visualization.hide();
        $outputTextLabel.hide();
        $outputText.hide();
      } else {
        $visualization.show();
        $outputTextLabel.show();
        $outputText.show();
      }
    }, 30);
  });

});
