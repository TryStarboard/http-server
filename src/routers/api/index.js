'use strict';

const Router = require('koa-router');
const unauthedRoute = require('./unauthed');
const authedRoute = require('./authed');

const router = new Router();

router.use('/api/v1', authedRoute.routes(), authedRoute.allowedMethods());
router.use('/api/v1', unauthedRoute.routes(), unauthedRoute.allowedMethods());

module.exports = router.routes();
