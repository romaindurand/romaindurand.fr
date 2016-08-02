var fileAsync = require("lowdb/lib/file-async");
var lowdb = require("lowdb");

var db = lowdb("db.json", {
	storage: fileAsync
});

db.init = function () {
	db.defaults({
		posts: []
	}).value();
};

module.exports = db;