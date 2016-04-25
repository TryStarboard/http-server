'use strict';

const Router = require('koa-router');
const config = require('config');

const ASSETS_BASE_URL = config.get('assets.baseUrl');

const router = new Router();

router.get('/', function *() {
  if (this.req.isAuthenticated()) {
    this.redirect('/dashboard');
    return;
  }

  yield this.render('index');
});

router.get('/dashboard', injectDefaultLocals, function *() {
  if (!this.req.isAuthenticated()) {
    this.redirect('/');
    return;
  }

  yield this.render('-inner');
});

router.get('/user-profile', injectDefaultLocals, function *() {
  if (!this.req.isAuthenticated()) {
    this.redirect('/');
    return;
  }

  yield this.render('-inner');
});

function *injectDefaultLocals(next) {
  this.state = {
    ASSETS_BASE_URL,
  };

  yield next;
}

module.exports = router.routes();
