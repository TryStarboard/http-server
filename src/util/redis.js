'use strict';

const config         = require('config');
const {createClient} = require('@starboard/shared-backend/redis');
const log            = require('@starboard/shared-backend/log');

const REDIS_CONFIG = config.get('redis');

module.exports = createClient(REDIS_CONFIG, log);
