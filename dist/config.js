'use strict';

var value = function value(key, defaultValue) {
  return process && process.env && process.env[key] || defaultValue;
};

var IOTA_BALANCE_TRESHOLD = value('IOTA_BALANCE_TRESHOLD', 100);

var IOTA_API_ENDPOINT = value('IOTA_API_ENDPOINT', 'https://field.deviota.com');

var IOTA_DEPTH = value('IOTA_DEPTH', 4);

var IOTA_MWM = value('IOTA_MWM', 14);

var PAGE_RESYNC_SECONDS = value('PAGE_RESYNC_SECONDS', 180);

module.exports = {
  IOTA_API_ENDPOINT: IOTA_API_ENDPOINT,
  IOTA_DEPTH: IOTA_DEPTH,
  IOTA_MWM: IOTA_MWM,
  IOTA_BALANCE_TRESHOLD: IOTA_BALANCE_TRESHOLD,
  PAGE_RESYNC_SECONDS: PAGE_RESYNC_SECONDS
};