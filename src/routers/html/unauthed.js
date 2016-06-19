'use strict';

const Router                                = require('koa-router');
const {fromCallback}                        = require('bluebird');
const log                                   = require('@starboard/shared-backend/log');
const {createLoginUrl, handleLoginCallback} = require('@starboard/shared-backend/github');
const {fetchUserProfile}                    = require('@starboard/shared-backend/model/User');
const upsertUser                            = require('@starboard/shared-backend/model/User').upsert;
const {enqueueSyncStarsJob}                 = require('../../util/JobQueue');

const unauthedRoute = new Router();

function *ensureUnauthed(next) {
  if (this.req.isAuthenticated()) {
    this.redirect('/dashboard');
    return;
  }

  yield next;
}

unauthedRoute.get('/github-login', ensureUnauthed, function *(next) {
  this.redirect(createLoginUrl());
});

unauthedRoute.get('/github-back', ensureUnauthed, function *(next) {
  try {
    const access_token = yield handleLoginCallback(this.query);
    const user = yield fetchUserProfile(access_token);
    const id = yield upsertUser(user, access_token);
    yield fromCallback((done) => this.req.login({id}, done));
    enqueueSyncStarsJob(id);
    this.redirect('/dashboard');
  } catch (err) {
    log.error(err, 'github auth callback error');
    this.redirect('/');
  }
});

module.exports = unauthedRoute;
