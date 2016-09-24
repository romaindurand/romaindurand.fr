var Client = require('../public/script')
var lowdb = require('lowdb')
var fileAsync = require('lowdb/lib/file-async')
var Mustache = require('mustache')
var templateData = require('./template-data')
var db = lowdb('db.json', {
  storage: fileAsync
})

module.exports = function (app, req) {
  var path = req.url

  var client = new Client()
  if (client.isValidPath(path)) {
    var posts = db.get('posts')
    var result
    var allowedTags
    var requestedTags = []
    if (req.query.tags) {
      requestedTags = req.query.tags.split(',')
    }
    if (path.startsWith('/gallerie')) {
      allowedTags = ['Abstract', 'Manga', 'Others', 'Graffiti', 'Portraits']
    } else {
      allowedTags = [undefined]
    }
    var filtersData = templateData.getFiltersFromTags(allowedTags, requestedTags)
    if (req.query.tags) {
      allowedTags = allowedTags.filter(function (allowedTag) {
        return requestedTags.includes(allowedTag)
      })
    }
    result = Mustache.render(app.templates.filters, filtersData)
    result += posts.filter(function (post) {
      if (!post.tags) {
        return allowedTags.includes(undefined)
      }
      return post.tags.every(tag => allowedTags.includes(tag))
    }).sort('timestamp').value().reduce(function (memo, post) {
      post.date = new Date(post.timestamp * 1000).toLocaleString()
      return memo + Mustache.render(app.templates.post, post)
    }, '')
    return result
  } else return ''
}
