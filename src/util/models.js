'use strict';

const config = require('config');
const create = require('@starboard/models').create;

module.exports = create(config.get('postgres'));
