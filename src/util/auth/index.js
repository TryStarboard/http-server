'use strict'

const passport = require('koa-passport')
const {wrap} = require('co')
const log = require('../log')
const {User} = require('../models')

passport.serializeUser(function (user, done) {
  done(null, user.id)
})

passport.deserializeUser(wrap(function *(id, done) {
  try {
    const user = yield User.findById(id)
    if (!user) {
      done(null, false)
    } else {
      done(null, user)
    }
  } catch (err) {
    log.error(err)
    done(err)
  }
}))

const authInit = passport.initialize()
const authSession = passport.session()

module.exports = {
  authInit,
  authSession,
  passport
}
