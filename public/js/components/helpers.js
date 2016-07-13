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
 /* eslint no-unused-vars: "off" */

'use strict';

/**
 * Get range transformation of @param value
 * @param {float} value value
 * @param {float} min min
 * @param {float} max max
 * @return {float} projected value
 */
function range(value, min, max) {
  return (value - min) / (max - min);
}

/**
 * Get range transformation of @param value in percent
 * @param {float} value The value
 * @param {float} min Minimum
 * @param {float} max Maximum
 * @return {float} projected value in percent
 */
function rangeToPercent(value, min, max) {
  return Math.round(100 * range(value, min, max));
}

/**
 * Cleans up string
 * @param {String} str The String
 * @return {String} normalized string
 */
function normalize(str) {
  return str.replace(/\s+/g, '-').toLowerCase();
}

/**
 * Scrolls page to @param element
 * @param {$element} $element The element
 * @return {undefined}
 */
function scrollTo($element) {
  $('html, body').animate({ scrollTop: $element.offset().top }, 'fast');
}

/**
 * Move element in @param arr from @param oldIndex to @param newIndex.
 * @param {Array} arr the array
 * @param {int} oldIndex old index
 * @param {int} newIndex new index
 * @return {Array} arr
 */
function move(arr, oldIndex, newIndex) {
  var internalArray = arr;
  var internalOldIndex = oldIndex;
  var internalNewIndex = newIndex;
  while (internalOldIndex < 0) {
    internalOldIndex += internalArray.length;
  }
  while (internalNewIndex < 0) {
    internalNewIndex += internalArray.length;
  }
  if (internalNewIndex >= internalArray.length) {
    var k = internalNewIndex - internalArray.length;
    while ((k--) + 1) {
      internalArray.push(undefined); // eslint-disable-line no-undefined
    }
  }
  internalArray.splice(internalNewIndex, 0, internalArray.splice(internalOldIndex, 1)[0]);
  return internalArray;
}
