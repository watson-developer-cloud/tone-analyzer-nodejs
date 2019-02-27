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
