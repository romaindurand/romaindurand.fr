var Client = require("../public/script");
var logSymbols = require("log-symbols");
var Mustache = require("mustache");
var renderContent = require("../lib/render-content");

module.exports = function renderPage(app, req, res) {

	var client = new Client();
	if (!client.isValidPath(req.url)) {
		console.log(logSymbols.error, "404 " + req.url);
		res.status(404);
	}
	res.setHeader("Cache-Control", "public, max-age=86400000");
	var output = Mustache.render(app.templates.layout, {
		content: renderContent(app, req.url),
		title: client.getTitle(req.url),
		menuItems: client.pageList.map(function (page) {
			if (page.path === req.url) {
				page.active = true;
				return page;
			}
			return page;
		}),
		tagline: client.getTagline()
	}, {
		menu: app.templates.menu,
		header: app.templates.header
	});
	res.send(output);
};