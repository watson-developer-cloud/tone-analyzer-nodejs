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

 /* global $:false */

'use strict';

/**
 * Get range transformation of @param value
 * @param {float} value
 * @param {float} min
 * @param {float} max
 * @return {float} projected value
 */
function range(value, min, max) {
  return (value - min) / (max - min);
}

/**
 * Get range transformation of @param value in percent
 * @param {float} value
 * @param {float} min
 * @param {float} max
 * @return {float} projected value in percent
 */
function rangeToPercent(value, min, max) {
  return Math.round(100 * range(value, min, max));
}

/**
 * Cleans up string
 * @param {String} str
 * @return {String} normalized string
 */
function normalize(str) {
  return str.replace(/\s+/g, '-').toLowerCase();
}

/**
 * Scrolls page to @param element
 * @param {$element} $element
 */
function scrollTo($element) {
  $('html, body').animate({ scrollTop: $element.offset().top }, 'fast');
}

/**
 * Move element in @param arr from @param old_index to @param new_index.
 * Mutates @param arr
 * @param {Array} arr
 * @param {int} old_index
 * @param {int} new_index
 * @return {Array} arr
 */
function move(arr, old_index, new_index) {
    while (old_index < 0) {
        old_index += arr.length;
    }
    while (new_index < 0) {
        new_index += arr.length;
    }
    if (new_index >= arr.length) {
        var k = new_index - arr.length;
        while ((k--) + 1) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr;
}
