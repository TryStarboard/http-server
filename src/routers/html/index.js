'use strict';

const Router = require('koa-router');
const config = require('config');

const APP_JS_URL = config.get('assets.hash.app.js');
const APP_CSS_URL = config.get('assets.hash.app.css');

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
    APP_JS_URL,
    APP_CSS_URL,
  };

  yield next;
}

module.exports = router.routes();
