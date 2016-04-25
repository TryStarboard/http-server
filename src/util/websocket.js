const socketio              = require('socket.io');
const Cookies               = require('cookies');
const co                    = require('co');
const {curry}               = require('ramda');
const {props}               = require('bluebird');
const config                = require('config');
const log                   = require('../../../shared-backend/log');
const redisClient           = require('../../../shared-backend/redis').client;
const {subClient}           = require('../../../shared-backend/pubsub');
const subscribeRedis        = require('../../../shared-backend/pubsub').subscribe;
const unsubscribeRedis      = require('../../../shared-backend/pubsub').unsubscribe;
const {getReposWithIds}     = require('../../../shared-backend/model/Repos');
const getAllTags            = require('../../../shared-backend/model/Tags').getAll;
const {enqueueSyncStarsJob} = require('./JobQueue');

const {
  UPDATE_SOME_REPOS,
  REMOVE_REPOS,
  UPDATE_TAGS,
  UPDATE_PROGRESS,
  SYNC_REPOS,
} = require('../../../shared/action-types');

const COOKIE_KEYS = config.get('cookie.keys');

function authenticate(socket, next) {
  co(function *() {

    const cookies = new Cookies(socket.request, null, COOKIE_KEYS);
    const sid = cookies.get('koa.sid', {signed: true});

    const str = yield redisClient.get(`koa:sess:${sid}`);

    const obj = JSON.parse(str);

    if (!obj || obj.passport.user == null) {
      next(new Error('session not found, cannot auth websocket'));
    } else {
      socket.handshake.user = {id: obj.passport.user};
      next();
    }

  }).catch(next);
}

const handleChannelMessage = curry((socket, user_id, channelName, channel, message) => {
  if (channel !== channelName) {
    return;
  }

  const event = JSON.parse(message);

  switch (event.type) {
  case 'UPDATED_ITEM':
    props({
      repos: getReposWithIds(event.repo_ids),
      tags: getAllTags(user_id),
    })
    .then(({tags, repos}) => {
      socket.emit(UPDATE_TAGS, tags);
      socket.emit(UPDATE_SOME_REPOS, repos);
    });
    break;
  case 'DELETED_ITEM':
    socket.emit(REMOVE_REPOS, event.deleted_repo_ids);
    break;
  case 'PROGRESS_DATA_ITEM':
    socket.emit(UPDATE_PROGRESS, event.progress);
    break;
  default:
    // No additional case
  }
});

function handleConnection(socket) {
  const user_id = socket.handshake.user.id;
  const channelName = `sync-stars:user_id:${user_id}`;
  const messageHandler = handleChannelMessage(socket, user_id, channelName);

  subClient.on('message', messageHandler);
  subscribeRedis(channelName);
  socket.on(SYNC_REPOS, () => {
    enqueueSyncStarsJob(user_id)
      .catch((err) => {
        log.error({err, user_id}, 'ENQUEUE_JOB_ERROR');
      });
  });

  // Clean up
  socket.on('disconnect', () => {
    unsubscribeRedis(channelName);
    subClient.removeListener('message', messageHandler);
  });
}

function createWebsocketServer(server) {
  const io = socketio(server, {serveClient: false});
  io.use(authenticate);
  io.on('connection', handleConnection);
}

module.exports = {
  createWebsocketServer,
};