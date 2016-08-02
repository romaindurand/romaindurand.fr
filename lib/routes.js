var fs = require("fs");
var logSymbols = require("log-symbols");
var Client = require("../public/script");
var express = require("express");
var renderContent = require("../lib/render-content");
var Mustache = require("mustache");

var fileMappings = [
	{
		reqPath: "/fetch-polyfill.js",
		resPath: "node_modules/whatwg-fetch/fetch.js"
	}
];

module.exports = function (app) {

	app.get("/page/:page?", function (req, res) {
		var page = req.params.page ? "/" + req.params.page : "/";
		res.send(renderContent(app, page));
	});

	app.use(express.static("public"));
	fileMappings.forEach(function (fileMapping) {
		app.use(fileMapping.reqPath, express.static(fileMapping.resPath));
	});

	app.use(express.static("public"));
	app.get("*", getPage);

	function getPage(req, res) {
		var client = new Client();
		if (!client.isValidPath(req.url)) {
			console.log(logSymbols.error, "404 " + req.url);
			res.status(404);
		}
		fs.readFile("./index.html", "utf-8", function (err, data) {
			res.setHeader("content-type", "text/html");
			var output = Mustache.render(data, {
				content: renderContent(app, req.url)
			});
			res.send(output);
		});
	}
};
