'use strict'

const Router = require('koa-router')
const co = require('co')
const {sequelize, Tag} = require('../../../util/models')

function *ensureAuthed(next) {
  if (this.req.isAuthenticated()) {
    yield next
  } else {
    this.res.status = 401
  }
}

const authedRoute = new Router()

authedRoute.get('/logout', ensureAuthed, function *() {
  this.req.logout()
  this.status = 200
})

authedRoute.get('/me', ensureAuthed, function *() {
  this.body = this.req.user.toJSON()
})

authedRoute.get('/repos', ensureAuthed, function *() {
  const repos = yield this.req.user.getRepos({include: [Tag]})

  this.body = repos.map(repo => {
    const json = repo.toJSON()
    json.tags = json.tags.map(t => t.id)
    return json
  })
})

authedRoute.post('/tags', ensureAuthed, function *(next) {
  try {
    const tag = yield this.req.user.createTag({text: this.request.body.name})
    this.body = tag.toJSON()
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      this.status = 409
      this.body = {error: `"${this.request.body.name}" already exists`}
      return
    }
    throw err
  }
})

authedRoute.get('/tags', ensureAuthed, function *(next) {
  const tags = yield this.req.user.getTags()
  this.body = tags.map(tag => tag.toJSON())
})

authedRoute.delete('/tags/:id', ensureAuthed, function *(next) {
  const ctx = this

  yield sequelize.transaction(co.wrap(function *(t) {
    const [tag] = yield ctx.req.user.getTags({
      where: {
        id: ctx.params.id
      },
      limit: 1,
      transaction: t
    })

    if (tag) {
      yield tag.destroy({transaction: t})
      ctx.status = 200
    } else {
      ctx.status = 404
    }
  }))
})

authedRoute.post('/repo_tags', ensureAuthed, function *() {
  const ctx = this

  yield sequelize.transaction(co.wrap(function *(t) {
    const [repo] = yield ctx.req.user.getRepos({
      where: {
        id: ctx.request.body.repo_id
      },
      limit: 1,
      transaction: t
    })

    if (repo) {
      yield repo.addTag(ctx.request.body.tag_id, {transaction: t})
      ctx.status = 200
    } else {
      ctx.status = 404
    }
  }))
})

authedRoute.delete('/repo_tags', ensureAuthed, function *() {
  const ctx = this

  yield sequelize.transaction(co.wrap(function *(t) {
    const [repo] = yield ctx.req.user.getRepos({
      where: {
        id: ctx.request.body.repo_id
      },
      limit: 1,
      transaction: t
    })

    if (repo) {
      yield repo.removeTag(ctx.request.body.tag_id, {transaction: t})
      ctx.status = 200
    } else {
      ctx.status = 404
    }
  }))
})

authedRoute.delete('/account', ensureAuthed, function *() {
  this.body = yield this.req.user.destroy()
})

module.exports = authedRoute
