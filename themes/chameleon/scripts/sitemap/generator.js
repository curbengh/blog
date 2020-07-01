'use strict'

const micromatch = require('micromatch')
const template = require('./template')
const moment = require('moment')

const isMatch = (path, patterns) => {
  if (patterns && patterns.length) {
    if (micromatch.isMatch(path, patterns, { matchBase: true })) return true
  }

  return false
}

module.exports = function (locals) {
  const config = this.config
  const skipRenderList = ['*.js', '*.css']

  if (Array.isArray(config.skip_render)) {
    skipRenderList.push(...config.skip_render)
  } else if (config.skip_render != null) {
    skipRenderList.push(config.skip_render)
  }

  const posts = [].concat(locals.posts.toArray(), locals.pages.toArray())
    .filter((post) => {
      return post.sitemap !== false && !isMatch(post.source, skipRenderList)
    })
    .sort((a, b) => {
      return b.date - a.date
    })
    // https://github.com/pyyzcwg2833/hexo-generator-sitemap/commit/a92dbbb83cc39ff60d43faa5cd688a56574a3889
    .map((post) => ({
      ...post,
      date: moment(post.date).format('YYYY-MM-DD[T00:00:00.000Z]'),
      updated: post.updated ? moment(post.updated).format('YYYY-MM-DD[T00:00:00.000Z]') : false
    }))

  // configuration dictionary
  const xmlConfig = {
    config: config,
    posts: posts
  }

  if (config.sitemap.tags !== false) {
    xmlConfig.tags = locals.tags.toArray()
  }

  if (config.sitemap.categories !== false) {
    xmlConfig.categories = locals.categories.toArray()
  }

  const xml = template(config).render(xmlConfig)

  return {
    path: config.sitemap.path,
    data: xml
  }
}
