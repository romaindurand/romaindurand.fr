var fileAsync = require("lowdb/lib/file-async");
var lowdb = require("lowdb");
var uid = require("uid");

var db = lowdb("db.json", {
	storage: fileAsync
});

db.init = function () {
	db.defaults({
		posts: []
	}).value();
	var posts = db.get("posts");
	posts.filter(post => post.id === undefined)
		.value()
		.forEach(post => {
			post.id = uid();
		});
	db.write();
};

module.exports = db;