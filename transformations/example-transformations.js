/* eslint-disable camelcase */

/*
 * Transform raw JSON input object into formatted Algolia record
 * -------------------------------------------------------------
 */
const striptags = require('striptags');

// Converts string 'true' to native true value, and all else to false
const toBoolean = boolStr => boolStr === 'true';

// Notice that we are splitting our string on the '|' character.
// Thus this method is assuming a pipe separated value string input.
const toIntArray = str =>
  str.split('|').map(stringNumber => parseInt(stringNumber, 10));

// Parse UNIX timestamp from date or datetime
const getTimeStamp = time => new Date(time).getTime() / 1000;

// Actual transformation function to be exported and applied to each JSON record
module.exports = (data, cb) => {
  const record = Object.assign({}, data);

  record.objectID = parseInt(data.product_id, 10);
  record.description = striptags(data.description);
  record.is_active = toBoolean(data.is_active);
  record.is_popular = toBoolean(data.is_popular);
  record.created_at = getTimeStamp(data.created_at);
  record.reviewed_at = getTimeStamp(data.reviewed_at);
  record.updated_at = getTimeStamp(data.updated_at);
  record.price_wholesale = parseInt(data.price_wholesale, 10);
  record.price = parseInt(data.price, 10);
  record.sales = parseInt(data.sales, 10);
  record.is_reviewed = parseInt(data.review_count, 10);
  record.rating = parseInt(data.rating, 10);
  record.facet_value_psv = toIntArray(data.facet_value_psv);

  cb(null, record);
};
