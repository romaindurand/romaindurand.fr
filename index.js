var express = require("express");
var app = express();
var logSymbols = require("log-symbols");
var routes = require("./lib/routes");
var db = require("./lib/db");
var loadTemplates = require("./lib/templates");

db.init();
loadTemplates(app);
routes(app);

app.listen(3000, function () {
	console.log(logSymbols.success, "Server listening on port 3000. http://localhost:3000");
});

