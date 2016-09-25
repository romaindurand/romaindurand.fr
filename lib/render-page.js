var Client = require('../public/script')
var logSymbols = require('log-symbols')
var Mustache = require('mustache')
var renderContent = require('../lib/render-content')

module.exports = function renderPage (app, req, res) {
  var client = new Client()
  if (!client.isValidPath(req.url)) {
    console.log(logSymbols.error, '404 ' + req.url)
    res.status(404).send('404')
    return
  }
  var content = renderContent(app, req)
  var output = Mustache.render(app.templates.layout,
    {
      content: content,
      title: client.getTitle(req.url),
      menuItems: client.pageList.map(function (page) {
        if ((req.url.startsWith(page.path) && page.path !== '/') || (page.path === req.url)) {
          page.active = true
          return page
        }
        return page
      })
    }, {
      menu: app.templates.menu,
      header: app.templates.header
    })
  res.setHeader('Cache-Control', 'public, max-age=86400000')
  res.send(output)
}
