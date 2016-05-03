'use strict';

const log = require('@starboard/shared-backend/log');

process.on('unhandledRejection', (reason, promise) => {
  // reason might be an instance of Error
  log.error({err: reason}, 'unhandled rejection');
});

process.on('uncaughtException', (error) => {
  log.error(error, 'uncaught exception');
});
