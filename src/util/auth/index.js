'use strict';

const passport = require('koa-passport');
const {wrap} = require('co');
const log = require('../log');
const db = require('../models').db;

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(wrap(function *(id, done) {
  try {
    const [user] = yield db('users').select('id').where({id}).limit(1);

    if (!user) {
      done(null, false);
    } else {
      done(null, user);
    }
  } catch (err) {
    log.error(err);
    done(err);
  }
}));

const authInit = passport.initialize();
const authSession = passport.session();

module.exports = {
  authInit,
  authSession,
  passport,
};
