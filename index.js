var express = require("express");
var app = express();
var fs = require("fs");
var Client = require("./public/script");

app.get("/page/:page?", function (req, res) {
	console.log("page/ req.params.page : " + req.params.page);
	var page = req.params.page ? "/" + req.params.page : "/";
	res.send(renderContent(page));
});
app.get("/", getPage);
app.use(express.static("public"));
app.get("*", getPage);

app.listen(3000, function () {
	console.log("Example app listening on port 3000!");
});

function renderContent(path) {
	var client = new Client();
	console.log("renderContent path : " + path);
	if (client.isValidPath(path)) {
		if (path === "/blog") {
			return "<a href=\"/\">Home</a>";
		}
		return "Hello World!" + path;
	} else return "404";
}

function getPage(req, res) {
	var client = new Client();
	if (!client.isValidPath(req.url)) {
		console.log("404 " + req.url);
		res.status(404);
	}
	fs.readFile("./public/index.html", "utf-8", function (err, data) {
		res.setHeader("content-type", "text/html");
		var response = data.replace("{{content}}", renderContent(req.url));
		res.send(response);
	});
}
