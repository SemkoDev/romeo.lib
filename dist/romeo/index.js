'use strict';

var page = require('./page');
var pages = require('./pages');

var _require = require('./romeo'),
    Romeo = _require.Romeo,
    DEFAULT_OPTIONS = _require.DEFAULT_OPTIONS;

module.exports = {
  page: page,
  pages: pages,
  Romeo: Romeo,
  DEFAULT_OPTIONS: DEFAULT_OPTIONS
};