'use strict';

const session = require('koa-generic-session');
const redisStore = require('koa-redis');
const {createClient} = require('./redis');

module.exports = session({
  store: redisStore({
    client: createClient()
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 30, // a month
  },
});
