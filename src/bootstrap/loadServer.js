/*eslint no-process-exit:0*/

'use strict';

const http = require('http');
const log = require('@starboard/shared-backend/log');
const createKoaServer = require('./createKoaServer');

const koaApp = createKoaServer();

const server = http.createServer(koaApp.callback());

server.listen(10000, '0.0.0.0', () => {
  log.info('server start');
});

['SIGTERM', 'SIGINT'].forEach(function (sig) {
  process.once(sig, function () {
    log.info({signal: sig}, 'receive signal');
    server.close(function () {
      log.info({signal: sig}, 'server closed');
      process.exit(0);
    });
  });
});
