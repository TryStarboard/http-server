'use strict';

const Router                      = require('koa-router');
const getAllRepos                 = require('@starboard/shared-backend/model/Repos').getAll;
const {addTag, deleteTag}         = require('@starboard/shared-backend/model/Tags');
const getAllTags                  = require('@starboard/shared-backend/model/Tags').getAll;
const {addRepoTag, deleteRepoTag} = require('@starboard/shared-backend/model/RepoTags');
const {deleteUser}                = require('@starboard/shared-backend/model/User');
const findUserById                = require('@starboard/shared-backend/model/User').findById;
const {UniqueConstraintError}     = require('@starboard/shared-backend/model/Errors');

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
  this.body = yield findUserById(this.req.user.id);
});

authedRoute.get('/repos', ensureAuthed, function *() {
  this.body = yield getAllRepos(this.req.user.id);
});

authedRoute.post('/tags', ensureAuthed, function *(next) {
  try {
    this.body = yield addTag(this.req.user.id, this.request.body.name);
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
  this.body = yield getAllTags(this.req.user.id);
});

authedRoute.delete('/tags/:id', ensureAuthed, function *(next) {
  this.body = yield deleteTag(this.params.id);
});

authedRoute.post('/repo_tags', ensureAuthed, function *() {
  this.body = yield addRepoTag(this.request.body);
});

authedRoute.delete('/repo_tags', ensureAuthed, function *() {
  this.body = yield deleteRepoTag(this.request.body);
});

authedRoute.delete('/account', ensureAuthed, function *() {
  this.body = yield deleteUser(this.req.user.id);
});

module.exports = authedRoute;
