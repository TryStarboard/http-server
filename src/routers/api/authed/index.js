'use strict';

const Router = require('koa-router');
const {UniqueConstraintError} = require('@starboard/models/src/Errors');
const {User, Tag, Repo, RepoTag} = require('../../../util/models');

function *ensureAuthed(next) {
  if (this.req.isAuthenticated()) {
    yield next;
  } else {
    this.res.status = 401;
  }
}

const authedRoute = new Router();

authedRoute.get('/logout', ensureAuthed, function *() {
  this.req.logout();
  this.status = 200;
});

authedRoute.get('/me', ensureAuthed, function *() {
  this.body = yield User.findById(this.req.user.id);
});

authedRoute.get('/repos', ensureAuthed, function *() {
  this.body = yield Repo.getAll(this.req.user.id);
});

authedRoute.post('/tags', ensureAuthed, function *(next) {
  try {
    this.body = yield Tag.addTag(this.req.user.id, this.request.body.name);
  } catch (err) {
    if (err instanceof UniqueConstraintError && err.field === 'text') {
      this.status = 409;
      this.body = {error: `"${this.request.body.name}" already exists`};
      return;
    }
    throw err;
  }
});

authedRoute.get('/tags', ensureAuthed, function *(next) {
  this.body = yield Tag.getAll(this.req.user.id);
});

authedRoute.delete('/tags/:id', ensureAuthed, function *(next) {
  this.body = yield Tag.deleteTag(this.params.id);
});

authedRoute.post('/repo_tags', ensureAuthed, function *() {
  this.body = yield RepoTag.addRepoTag(this.request.body);
});

authedRoute.delete('/repo_tags', ensureAuthed, function *() {
  this.body = yield RepoTag.deleteRepoTag(this.request.body);
});

authedRoute.delete('/account', ensureAuthed, function *() {
  this.body = yield User.deleteUser(this.req.user.id);
});

module.exports = authedRoute;
