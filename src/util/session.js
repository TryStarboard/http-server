'use strict';

const session        = require('koa-generic-session');
const redisStore     = require('koa-redis');
const config         = require('config');
const {createClient} = require('../../../shared-backend/redis');

module.exports = session({
  store: redisStore({
    client: createClient(config.get('redis'))
  }),
});