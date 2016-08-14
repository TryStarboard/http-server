'use strict'

const kue = require('kue')
const {wrap} = require('co')
const {createClient, sharedClient: redis} = require('./redis')
const log = require('./log')

const queue = kue.createQueue({
  redis: {
    createClientFactory: createClient
  }
})

const enqueueSyncStarsJob = wrap(function *(userId) {
  const key = `{uniq-job:sync-stars}:user_id:${userId}`
  const result = yield redis.getset(key, Date.now().toString())
  log.info({value: result}, 'ENQUEUE_UNIQUE_JOB_CHECK')
  // result will be `null` when first time "getset"
  if (result !== null) {
    return
  }
  queue.create('sync-stars', {user_id: userId}).save()
  yield redis.expire(key, 30) // 30 sec
})

module.exports = {
  enqueueSyncStarsJob
}
