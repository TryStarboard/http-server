'use strict';

const session        = require('koa-generic-session');
const redisStore     = require('koa-redis');
const config         = require('config');
const {createClient} = require('@starboard/shared-backend/redis');

module.exports = session({
  store: redisStore({
    client: createClient(config.get('redis'))
  }),
  cookie: {
    maxage: 1000 * 60 * 60 * 24 * 30,
  },
});
