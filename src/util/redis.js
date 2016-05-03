'use strict';

const config         = require('config');
const {createClient} = require('../../../shared-backend/redis');
const log            = require('../../../shared-backend/log');

const REDIS_CONFIG = config.get('redis');

module.exports = createClient(REDIS_CONFIG, log);
