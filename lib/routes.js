var logSymbols = require("log-symbols");
var Client = require("../public/script");
var express = require("express");
var renderContent = require("../lib/render-content");
var Mustache = require("mustache");
var oneDay = 86400000;

var fileMappings = [
	{
		reqPath: "/fetch-polyfill.js",
		resPath: "node_modules/whatwg-fetch/fetch.js"
	}
];

var staticFileConf = {
	maxAge: oneDay
};

module.exports = function (app) {
	app.get("/page/:page?", function (req, res) {
		var page = req.params.page ? "/" + req.params.page : "/";
		res.send(renderContent(app, page));
	});

	app.use(express.static("public", staticFileConf));


	fileMappings.forEach(function (fileMapping) {
		app.use(fileMapping.reqPath, express.static(fileMapping.resPath, staticFileConf));
	});


	// app.use(express.static("public"));
	app.get("*", getPage);

	function getPage(req, res) {
		var client = new Client();
		if (!client.isValidPath(req.url)) {
			console.log(logSymbols.error, "404 " + req.url);
			res.status(404);
		}
		res.setHeader("Cache-Control", "public, max-age=" + oneDay);
		var output = Mustache.render(app.templates.layout, {
			content: renderContent(app, req.url),
			title: client.getTitle(req.url),
			menuItems: client.pageList.map(function(page) {
				if (page.path === req.url) {
					page.active = true;
					return page;
				}
				return page;
			})
		}, {
			menu: app.templates.menu
		});
		res.send(output);
	}
};