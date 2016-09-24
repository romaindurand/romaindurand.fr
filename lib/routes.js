var express = require('express')
var renderContent = require('../lib/render-content')
var renderPage = require('../lib/render-page')

var oneDay = 86400000
var fileMappings = [
  {
    reqPath: '/fetch-polyfill.js',
    resPath: 'node_modules/whatwg-fetch/fetch.js'
  }
]
var staticFileConf = {
  maxAge: oneDay
}

module.exports = function (app) {
  app.get('/page/:page?', function (req, res) {
    if (req.params.page) {
      req.url = '/' + req.params.page
    }
    // var page = req.params.page ? "/" + req.params.page : "/"
    var content = renderContent(app, req)
    // console.log(data)
    if (content === '404') {
      res.status(404).send(content)
    }
    res.send(content)
  })

  app.use(express.static('public', staticFileConf))

  fileMappings.forEach(function (fileMapping) {
    app.use(fileMapping.reqPath, express.static(fileMapping.resPath, staticFileConf))
  })

  app.get('*', renderPage.bind(undefined, app))
}
