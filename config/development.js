'use strict';

const join = require('path').join;

module.exports = {
  assets: {
    baseUrl: 'http://localhost:10010',
    hash: {
      main: {
        js: 'bundle.js'
      }
    },
  },
  cookie: {
    keys: ['keyboard cat', 'starboard'],
  },
};
