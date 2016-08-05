var fs = require("fs");
var logSymbols = require("log-symbols");

module.exports = function loadTemplates(app) {
	console.log(logSymbols.info, "Loading templates ...");
	app.templates = {
		layout: fs.readFileSync("./templates/layout.hbs", "utf-8"),
		post: fs.readFileSync("./templates/post.hbs", "utf-8"),
		menu: fs.readFileSync("./templates/menu.hbs", "utf-8")
	};
	console.log(logSymbols.success, "Templates loaded.");
};
