var Client = require("../public/script");
var lowdb = require("lowdb");
var fileAsync = require("lowdb/lib/file-async");
var Mustache = require("mustache");
var db = lowdb("db.json", {
	storage: fileAsync
});

module.exports = function (app, path) {
	var client = new Client();
	if (client.isValidPath(path)) {
		var posts = db.get("posts");
		return posts.value().reduce(function (memo, post) {
			return memo + Mustache.render(app.templates.post, post);
		}, "");
	} else return "404";
};