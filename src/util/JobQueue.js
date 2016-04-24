'use strict';

const kue            = require('kue');
const config         = require('config');
const {wrap}         = require('co');
const log            = require('../../../shared-backend/log');
const {createClient} = require('../../../shared-backend/redis');

const REDIS_CONFIG = config.get('redis');

const queue = kue.createQueue({
  redis: {
    createClientFactory: () => createClient(REDIS_CONFIG, log),
  }
});

const enqueueSyncStarsJob = wrap(function *(user_id) {
  const key = `{uniq-job:sync-stars}:user_id:${user_id}`;
  const result = yield redisClient.getset(key, Date.now().toString());
  log.info({value: result}, 'ENQUEUE_UNIQUE_JOB_CHECK');
  // result will be `null` when first time "getset"
  if (result !== null) {
    return;
  }
  queue.create('sync-stars', {user_id}).save();
  yield redisClient.expire(key, 30); // 30 sec
});

module.exports = {
  enqueueSyncStarsJob,
};
