'use strict'

const Router = require('koa-router')
const {fromCallback} = require('bluebird')
const co = require('co')
const log = require('../../util/log')
const {sequelize, User} = require('../../util/models')
const {createLoginUrl, handleLoginCallback, fetchUserProfile} = require('../../util/github')
const {enqueueSyncStarsJob} = require('../../util/JobQueue')

const unauthedRoute = new Router()

function *ensureUnauthed(next) {
  if (this.req.isAuthenticated()) {
    this.redirect('/dashboard')
    return
  }

  yield next
}

unauthedRoute.get('/github-login', ensureUnauthed, function *(next) {
  this.redirect(createLoginUrl())
})

unauthedRoute.get('/github-back', ensureUnauthed, function *(next) {
  try {
    const accessToken = yield handleLoginCallback(this.query)
    const userData = yield fetchUserProfile(accessToken)
    const user = yield upsertUser(userData, accessToken)
    yield fromCallback((done) => this.req.login({id: user.id}, done))
    enqueueSyncStarsJob(user.id)
    this.redirect('/dashboard')
  } catch (err) {
    log.error(err, 'github auth callback error')
    this.redirect('/')
  }
})

function upsertUser(userData, accessToken) {
  return sequelize.transaction(co.wrap(function *(t) {
    const userAttributes = {
      github_id: userData.id,
      email: userData.email,
      username: userData.username,
      displayname: userData.name,
      avatar: userData.avatar_url,
      access_token: accessToken
    }

    const [user, created] = yield User.findOrCreate({
      where: {
        github_id: userData.id
      },
      defaults: userAttributes,
      transaction: t
    })

    if (created) {
      return user
    }

    yield user.update(userAttributes, {transaction: t})
    return user
  }))
}

module.exports = unauthedRoute
