var fs = require("fs");
var logSymbols = require("log-symbols");

module.exports = function loadTemplates(app) {
	console.log(logSymbols.info, "Loading templates ...");
	app.templates = {
		post: fs.readFileSync("./post.tpl", "utf-8")
	};
	console.log(logSymbols.success, "Templates loaded.");
};
