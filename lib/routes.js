var express = require("express");
var renderContent = require("../lib/render-content");
var renderPage = require("../lib/render-page");

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

	app.get("*", renderPage.bind(undefined, app));
};