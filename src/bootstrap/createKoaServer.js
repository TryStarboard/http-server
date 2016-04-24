'use strict';

const {join}                  = require('path');
const config                  = require('config');
const koa                     = require('koa');
const koaStatic               = require('koa-static');
const bodyParser              = require('koa-bodyparser');
const koaLogger               = require('koa-logger');
const views                   = require('koa-views');
const log                     = require('../../../shared-backend/log');
const session                 = require('../util/session');
const {authInit, authSession} = require('../util/auth');
const apiRoute                = require('../routers/api');
const htmlRoute               = require('../routers/html');
const unauthedRoute           = require('../routers/html/unauthed');

module.exports = function createKoaServer() {

  const app = koa();

  app.keys = config.get('cookie.keys');

  app.use(koaStatic(join(__dirname, '../../public')));
  app.use(koaStatic(join(__dirname, '../../static')));

  app.use(views(join(__dirname, '../../template'), {
    extension: 'jade',
  }));

  if (process.env.NODE_ENV !== 'production') {
    app.use(koaLogger());
  }

  app.use(function *(next) {
    const t1 = Date.now();
    try {
      yield next;
      log.info({
        req: this.request,
        res: this.response,
        responseTime: Date.now() - t1,
      }, 'request');
    } catch (err) {
      this.status = 500;
      if (process.env.NODE_ENV !== 'production') {
        this.body = err.stack;
      }
      log.error({
        req: this.request,
        res: this.response,
        responseTime: Date.now() - t1,
        err,
      }, 'request error');
    }
  });

  app.use(session);
  app.use(bodyParser());
  app.use(authInit);
  app.use(authSession);
  app.use(apiRoute);
  app.use(htmlRoute);
  app.use(unauthedRoute.routes());

  return app;
};
