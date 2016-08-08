/*globals $*/
function App() {
	this.pageList = [
		{
			path: "/",
			menuLabel: "Accueil",
			title: ""
		},
		{
			path: "/dev",
			menuLabel: "/dev"
		},
		{
			path: "/musique",
			menuLabel: "Musique"
		},
		{
			path: "/blog",
			menuLabel: "Blog"
		},
		{
			path: "/gallerie",
			menuLabel: "Gallerie"
		}
	];
	this.taglines = [
		"Obviously not a web design blog"
	];
}

App.prototype.start = function () {
	this.initializeServiceWorker();
	this.manageNavigation();
	window.history.replaceState({ url: this.getPath() }, "");
};

App.prototype.updatePageTitle = function () {
	var path = this.getPath();
	if (this.isValidPath(path)) {
		var activeMenuItem = $("#menu a[href='" + path + "']");
		$("#menu li").removeClass("active");
		activeMenuItem.parent().addClass("active");
		$("title").html(this.getTitle(path));
	}
};

App.prototype.getTitle = function (path) {
	var page = this.pageList.find(function (page) {
		return page.path === path;
	});
	var pageTitle = page.title || page.menuLabel;
	return "Romain Durand" + (pageTitle ? " - " + pageTitle : "");
};

App.prototype.getTagline = function () {
	var index = ~~ (Math.random() * this.taglines.length);
	return this.taglines[index];
};

App.prototype.isValidPath = function (path) {
	return this.pageList.find(function (page) {
		return page.path === path;
	});
};

App.prototype.loadPage = function (path) {
	fetch("page" + path).then(function (response) {
		return response.text();
	}).then(function (textValue) {
		var content = $("#content");
		// var div = document.createElement("div");
		// div.innerHTML = textValue;
		// content.innerHTML = "";
		content.html(textValue);
		this.updatePageTitle();
	}.bind(this));
};

App.prototype.getPath = function () {
	return window.location.pathname;
};

App.prototype.initializeServiceWorker = function () {
	if (!("serviceWorker" in navigator)) {
		return;
	}
	navigator.serviceWorker
		.register("/service-worker.js")
		.then(function () {
			console.info("Service worker registered");
		});
};

App.prototype.manageNavigation = function () {
	document.addEventListener("click", function (event) {
		if (event.ctrlKey || event.button === 1 || !$(event.target).is("a")) {
			return;
		}
		event.preventDefault();
		var a = document.createElement("a");
		a.href = event.target.href;
		var path = a.pathname;

		window.history.pushState({ url: path }, "", path);
		this.loadPage(path);
	}.bind(this), false);

	window.onpopstate = function (event) {
		this.loadPage(event.state.url);
	}.bind(this);
};

if (typeof module !== "undefined") module.exports = App;