'use strict';

const passport = require('koa-passport');
const {wrap} = require('co');
const db = require('@starboard/shared-backend/db');

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
