var express = require("express");
var app = express();
var fs = require("fs");

app.use(express.static("public"));
app.get("/page/:page", function(req, res) {
	console.log(req.params.page);
	res.send(`<div>dynamic content : ${req.params.page}</div>`);
});
app.get("*", function(req, res) {
	fs.readFile("./public/index.html", function(err, data) {
		console.log(err);
		console.log(data);
		res.setHeader("content-type", "text/html");
		res.send(data); 
// Mustache.render();
	});
});
app.listen(3000, function () {
	console.log("Example app listening on port 3000!");
});