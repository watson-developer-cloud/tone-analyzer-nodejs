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
/*global d3:false, $:false, WORD_TRAIT_CORR_TYPE:false */

'use strict';

/*
ToneGenomeViz: visualize a tone checker data with hierarchical data structure.
Author: Liang Gou, lgou@us.ibm.com
Date: Dec. 2012
*/

var umviz = window.umviz || {};

umviz.version = '0.0.1a';
umviz.dev = true //set false when in production

window.umviz = umviz;

umviz.models = {}; //stores all the possible models/components

umviz.models.toneGenome = function() {

  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------
  var margin = {
      top: -20,
      right: 40,
      bottom: 100,
      left: 35
    },
    width = 960,
    height = 170,
    //Create semi-unique ID in case user doesn't select one
    colorSchema, id = Math.floor(Math.random() * 10000),
    blockPadding = 3,
    //{positive: "_positive", negative: "_negative"}
    corrType = WORD_TRAIT_CORR_TYPE,
    animateDuration = 500,
    layoutMetric = 'percentile'
  ;
  //============================================================
  var partition = d3.layout.partition()
    .sort(function(a, b) {
      return a.id.localeCompare(b.id);
    })
    .value(function(d) {
      return layoutMetric === 'percentile' ? d.normalized_score : d.word_count;
    });

  function chart(selection) {
    selection.each(function(data) {

      var container = d3.select(this);
      container.select('g')
        .style('opacity', 1)
        .transition()
        .duration(animateDuration)
        .style('opacity', 0)
        .remove();

      var vis = container.append('g')
        .attr('class', 'umviz-toneGenome')
        .attr('transform', 'translate(' + margin.left + ' ' + margin.top + ')');

      vis.style('opacity', 0)
        .transition()
        .duration(animateDuration)
        .style('opacity', 1)
        .each('end', function() {
          d3.select(this)
            .style('opacity', null);
        });

      var x = d3.scale.linear()
        .range([0, width - margin.left - margin.right]);

      var y = d3.scale.linear()
        .range([0, height - margin.top - margin.bottom]);

      var layered_labels,
        layered_labels_for_upper_nodes = [],
        layered_labels_for_lower_nodes = [];

      //do partition layout first
      var pdata = partition.nodes(data);

      var blockSel = vis.selectAll('.g-block')
        .data(pdata, function(d) {
          return d.id;
        });

      var blockEnter = blockSel.enter()
        .append('g')
        .attr('class', 'g-block');

      //render the blocks;
      blockEnter.each(function(d) {
        render(d3.select(this), d);
      });

      function toPercentage(val) {
        var tmp = val * 100;
        return Math.round(tmp) + '%';
      }

      function render(selector, d) {

        var avg_font_width = 7,
          avg_font_height = 11,
          node_lbl = (layoutMetric === 'percentile') ?
          ((d.depth === 2) ? d.name + ' (' + toPercentage(d.normalized_score) + ')' : d.name + ' (' +
            toPercentage(d.dx) + ')') : ((d.depth === 2) ? d.name + ' (' + d.word_count + ')' : d.name + ' (' +
            toPercentage(d.dx) + ')'),
          offset_h = 0,
          layer_height = 20;

        //for the first level node, set the offset for the rect height as follow:
        if (d.depth === 1)
          offset_h = y(d.dy) / 2 + 0.5 * avg_font_height;

        //estimate the label width for current d:
        d.lblWidth = node_lbl.length * avg_font_width;

        // hide the root node
        if (d.depth === 0) selector.attr('display', 'none');


        //-------draw node rect--------------//
        //var rect;
        var rect = selector.append('rect')
          .attr('x', function(d) {
            return x(d.x) + blockPadding;
          })
          .attr('y', function(d) {
            return y(d.y) + offset_h + blockPadding;
          })
          .attr('width', function(d) {
            return Math.max(x(d.dx) - blockPadding, 0);
          })
          .attr('height', function(d) {
            return Math.max(y(d.dy) - offset_h - blockPadding, 0);
          })
          .attr('fill', function(d) {
            return colorSchema[d.id];
          })
          //.attr('fill-opacity', function (d) { return d.mixedNode ? 0.1 : 1; })
          .attr('stroke', function(d) {
            return colorSchema[d.id];
          })
          //.attr('stroke-width', function (d) { return d.mixedNode ? 1 : 0; })
          .attr('class', function(d) {
            return d.mixedNode ? 'g-block-mixed-background' : null;
          })
          .attr('id', function(d) {
            return d.mixedNode ? 'g_block_mixed_background_' + d.id : null;
          })
          .on('click', function(d) {
            //add click to show details for mixed node
            if (d.mixedNode)
              if (!d.showDetails) {
                d3.select(this).attr('display', 'none');
                vis.select('#g_block_' + d.id)
                  .attr('display', null);
                d.showDetails = true;
              } else {
                d3.select(this).attr('display', null);
                vis.select('#g_block_' + d.id)
                  .attr('display', 'none');
                d.showDetails = false;
              }
          });

        var rect_org = rect;
        if (d.mixedNode) {
          //this ratio is the positive score's ratio
          var ratio, score_p, score_n, count_p, count_n;
          if (d.linguistic_evidence.length === 2) {

            if (d.linguistic_evidence[0].correlation === 'positive') {
              score_p = d.linguistic_evidence[0].evidence_score;
              count_p = d.linguistic_evidence[0].word_count;
              score_n = d.linguistic_evidence[1].evidence_score;
              count_n = d.linguistic_evidence[1].word_count;
            } else {
              score_p = d.linguistic_evidence[1].evidence_score;
              count_p = d.linguistic_evidence[1].word_count;
              score_n = d.linguistic_evidence[0].evidence_score;
              count_n = d.linguistic_evidence[0].word_count;
            }
            ratio = layoutMetric === 'percentile' ?
            score_p / (score_p + score_n) : count_p / (count_p + count_n);
          }

          var totalRectHeight = y(d.dy) - offset_h - blockPadding,
            rect_p_w = ratio * x(d.dx) - blockPadding * 0.5,
            rect_n_w = (1 - ratio) * x(d.dx) - blockPadding * 0.5;

          rect = selector.append('g')
            .attr('class', 'g-block-mixed-parent')
            .attr('display', 'none')
            .attr('id', 'g_block_' + d.id);

          var rect_p = rect.append('g')
            .attr('class', 'g-block-mixed-child g-block-positive')
            .attr('corr', corrType.positive),

            rect_n = rect.append('g')
            .attr('class', 'g-block-mixed-child g-block-negative')
            .attr('corr', corrType.negative);
          //add positive word rect
          rect_p.append('rect')
            .attr('x', function(d) {
              return x(d.x) + blockPadding;
            })
            .attr('y', function(d) {
              return y(d.y) + offset_h + blockPadding;
            })
            .attr('width', Math.max(rect_p_w, 0))
            .attr('height', function() {
              return 0.5 * totalRectHeight;
            })
            .attr('fill', function(d) {
              return colorSchema[d.id];
            })
            .append('svg:title').text(function() {
              return 'Positive Words: ' + count_p;
            });

          rect_p.append('text')
            .attr('x', function(d) {
              return x(d.x) + (rect_p_w - 6 * avg_font_width) / 2;
            })
            .attr('y', function(d) {
              return y(d.y) + offset_h + blockPadding + 1.2 * avg_font_height;
            })
            .attr('class', function(d) {
              return 'text-in-box text-mixed-positive text-' + d.id + '_' + corrType.positive;
            })
            .text(function() {
              return 'P.' + ((layoutMetric === 'percentile') ?
                '(' + toPercentage(score_p) + ')' : '(' + count_p + ')');
            });

          addGenomeNodeEvent(rect_p, corrType.positive);
          //add negative word rect
          rect_n.append('rect')
            .attr('x', function(d) {
              return x(d.x) + blockPadding + rect_p_w;
            })
            .attr('y', function(d) {
              return y(d.y) + offset_h + blockPadding + totalRectHeight * 0.5;
            })
            .attr('width', Math.max(rect_n_w, 0))
            .attr('height', function() {
              return 0.5 * totalRectHeight;
            })
            .attr('fill', function(d) {
              return colorSchema[d.id];
            })
            .append('svg:title').text(function() {
              return 'Negative Words: ' + count_n;
            });

          rect_n.append('text')
            .attr('x', function(d) {

              return x(d.x) + rect_p_w + (rect_n_w - 6 * avg_font_width) / 2;
            })
            .attr('y', function(d) {
              return y(d.y) + offset_h + blockPadding +
                totalRectHeight * 0.5 + 1.2 * avg_font_height;
            })
            .attr('class', function(d) {
              return 'text-in-box text-mixed-negative text-' + d.id + '_' + corrType.negative;
            })
            .text(function() {
              return 'N.' + ((layoutMetric === 'percentile') ? '(' +
                toPercentage(score_n) + ')' : '(' + count_n + ')');
            });
          addGenomeNodeEvent(rect_n, corrType.negative);
        }

        //-------draw node label--------------//
        // only draw label with scores and tone type nodes
        if (d.depth === 1 || d.depth === 2) // d.words_count > 0 ||
          if ((x(d.dx) > d.lblWidth) && !d.mixedNode) {
            // if the rect width is larger than the text length,
            // put the text inside the rect
            selector.append('text')
              .attr('x', function(d) {
                return x(d.x) + (x(d.dx) - d.lblWidth) / 2;
              })
              .attr('y', function(d) {
                return y(d.y) + (y(d.dy) + avg_font_height) / 2;
              })
              .attr('class', function(d) {
                return 'text-in-box text-' + d.id + (d.depth === 2 ? ' text-tone-in-box' : '');
              })
              .text(function() {
                return node_lbl;
              });

            addGenomeNodeEvent(selector, null);

          } else {

            //render with layered labels
            //for nodes with layered labels above them
            if (d.depth === 1)
              layered_labels = layered_labels_for_upper_nodes;


            //for nodes with layered labels below them
            if (d.depth === 2)
              layered_labels = layered_labels_for_lower_nodes;

            //search the layered labels to find a right layer to place the label
            var layer_to_place = -1;
            for (var ldpt = 0; ldpt < layered_labels.length; ldpt++) {
              //for each layer, find the right place to do collison detection
              var leftlbl = null,
                rightlbl = null;

              // if the position is at the most left side
              if (d.x < layered_labels[ldpt][0].x) {
                leftlbl = null;
                rightlbl = layered_labels[ldpt][0];
              }
              // if the position is at the most right side
              else if (d.x > layered_labels[ldpt][layered_labels[ldpt].length - 1].x) {
                leftlbl = layered_labels[ldpt][layered_labels[ldpt].length - 1];
                rightlbl = null;
              }
              // if the position in the middle
              else
                for (var i = 0; i <= layered_labels[ldpt].length - 2; i++)
                  if (layered_labels[ldpt][i].x < d.x && d.x < layered_labels[ldpt][i + 1].x) {

                    leftlbl = layered_labels[ldpt][i];
                    rightlbl = layered_labels[ldpt][i + 1];
                  }

                  //collision detection:
              if (leftlbl !== null && rightlbl === null)
                if ((x(leftlbl.x) + x(leftlbl.dx) / 2 + leftlbl.lblWidth / 2) <
                    (x(d.x) + x(d.dx) / 2 - d.lblWidth / 2)) {
                  layer_to_place = ldpt;
                  break;
                }

              if (leftlbl === null && rightlbl !== null)
                if ((x(rightlbl.x) + x(rightlbl.dx) / 2 - rightlbl.lblWidth / 2) > 
                  (x(d.x) + x(d.dx) / 2 + d.lblWidth / 2)) {
                  layer_to_place = ldpt;
                  break;
                }

              if (leftlbl !== null && rightlbl !== null)
                if ((x(leftlbl.x) + x(leftlbl.dx) / 2 + leftlbl.lblWidth / 2) < (x(d.x) + x(d.dx) / 2 - d.lblWidth / 2) &&
                  (x(rightlbl.x) + x(rightlbl.dx) / 2 - rightlbl.lblWidth / 2) >
                    (x(d.x) + x(d.dx) / 2 + d.lblWidth / 2)) {

                  layer_to_place = ldpt;
                  break;
                }
            }

            if (layer_to_place === -1) {
              //add new layer to place
              layered_labels.push([d]);
              layer_to_place = layered_labels.length - 1;
            } else {
              //place the label
              layered_labels[layer_to_place].push(d);
              //sort nodes based their positions in the layout from left to right.
              layered_labels[layer_to_place].sort(function(a, b) {
                return (a.x - b.x);
              });
            }

            //draw line for the label pointer with rect. The height of the line is determined by the layer idx to be placed on

            selector.append('rect')
              .attr('x', x(d.x) + x(d.dx) / 2)
              .attr('y', function() {
                if (d.depth === 1) return y(d.y) + offset_h - layer_height * (layer_to_place + 1);
                if (d.depth === 2) return y(d.y) + y(d.dy);
              })
              .attr('width', 0.1)
              .attr('height', layer_height * (layer_to_place + 1))
              .attr('style', 'stroke: gray; stroke-width: 0.5');

            selector.append('text')
              .attr('x', x(d.x) + x(d.dx) / 2 - d.lblWidth / 2)
              .attr('y', function() {
                if (d.depth === 1) return y(d.y) + offset_h - layer_height * (layer_to_place + 1);
                if (d.depth === 2) return y(d.y) + y(d.dy) + layer_height * (layer_to_place + 1) +
                  avg_font_height;
              })
              .attr('class', function() {
                if (d.depth === 1) return 'text-above-box';
                if (d.depth === 2) return 'text-bellow-box';
              })
              .text(node_lbl);


            if (!d.mixedNode)
              addGenomeNodeEvent(rect, null);
            else {
              addGenomeNodeEvent(rect_org, null);
            }

          }
      }

      /**
       * Function to provide mouse over/click event for the genome node.
       * @param {[Object]} sel  [The d3 selection to add event into.]
       * @param {[Object]} corr [A parameter indicates if this node is mixed node
       * with positive or negative corr. Three possible values:
       * (1) null: not a mixed node;
       * (2) '_p': positive corr;
       * (3) '_n': negative corr. ]
       */
      function addGenomeNodeEvent(sel, corr) {
        //only for mixed child node, click to hide the details
        if (corr) {
          sel.on('click', function(d) {
            var curMixedNode = vis.select('#g_block_' + d.id);
            curMixedNode.attr('display', 'none');

            var pnd = d3.select(curMixedNode.node().parentNode);
            pnd.selectAll('.g-block-mixed-background').attr('display', null);
            d.showDetails = false;
          });
        }
        //add mouse-over event
        sel.on('mouseover', function(d) {
            //highlight hover blocks
            vis.selectAll('.g-block')
              .filter(function(ele) { return ele.id !== d.id; })
              .transition()
              .duration(animateDuration)
              .style('opacity', 0.1);

            //hover on a mixed-sub node (with positive or neg corr)
            if (corr !== null) {
              var block = vis.select('#g_block_' + d.id);
              block.selectAll('.g-block-mixed-child')
                .filter(function() {
                  return d3.select(this).attr('corr') !== sel.attr('corr');
                })
                .transition()
                .duration(animateDuration)
                .style('opacity', 0.1);

              block.selectAll('.text-mixed-' + sel.attr('corr'))
                .transition()
                .duration(animateDuration)
                .style('opacity', 1);

            }
            //highlight matched words
            highlightWordCategory(d.id, corr);

          })
          .on('mouseout', function(d) {
            //unhighlight blocks
            vis.selectAll('.g-block')
              .transition()
              .duration(animateDuration)
              .style('opacity', 1);

            if (corr !== null) {
              var block = vis.select('#g_block_' + d.id);
              block.selectAll('.g-block-mixed-child')
                .transition()
                .duration(animateDuration)
                .style('opacity', 1);

              block.selectAll('.text-mixed-' + sel.attr('corr'))
                .transition()
                .duration(animateDuration)
                .style('opacity', 0);
            }

            //unhighlight matched words
            unhighlightWordCategory();
          });
      }

      /**
       * To highlight words in a category.
       * @param  {[type]} cate category name
       * @param  {[type]} corr A parameter indicates if this node is mixed
       * node with positive or negative corr. Three possible values:
       * (1) '_positive': positive corr;
       * (2) '_negative': negative corr.
       * (3) null: not a mixed node, treat it as positive correlation;
       */
      function highlightWordCategory(cate, corr) {
        $('#output_div').css('color', '#ddd');
        $('.matched-word').css('opacity', 0.2);

        if (corr === null){
          $('.' + cate + '_' + corrType.positive).css('opacity', 1);
          $('.' + cate + '_' + corrType.negative).css('opacity', 1);
        }
        else
          $('.' + cate + '_' + corr).css('opacity', 1);
      }

      function unhighlightWordCategory() {
        $('#output_div').css('color', '#666');
        $('.matched-word').css('opacity', 1);
      }
    });

    return chart;
  }

  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------

  //chart.dispatch = dispatch;

  chart.margin = function(_) {
    if (!arguments.length)
      return margin;

    margin.top = typeof _.top !== 'undefined' ? _.top : margin.top;
    margin.right = typeof _.right !== 'undefined' ? _.right : margin.right;
    margin.bottom = typeof _.bottom !== 'undefined' ? _.bottom : margin.bottom;
    margin.left = typeof _.left !== 'undefined' ? _.left : margin.left;
    return chart;
  };

  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };

  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };

  chart.id = function(_) {
    if (!arguments.length) return id;
    id = _;
    return chart;
  };

  chart.colorSchema = function(_) {
    if (!arguments.length) return colorSchema;
    colorSchema = _;
    return chart;
  };

  chart.animateDuration = function(_) {
    if (!arguments.length) return animateDuration;
    animateDuration = _;
    return chart;
  };

  chart.corrType = function(_) {
    if (!arguments.length) return corrType;
    corrType.positive = typeof _.positive !== 'undefined' ? _.positive : corrType.positive;
    corrType.negative = typeof _.negative !== 'undefined' ? _.negative : corrType.negative;
    return chart;
  };

  chart.layoutMetric = function(_) {
    if (!arguments.length) return layoutMetric;
    layoutMetric = _;
    return chart;
  };
  return chart;
};
