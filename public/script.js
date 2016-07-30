/*globals $*/
function App() {
	this.pageList = ["/blog", "/musique", "/dev", "/", "/gallerie"];
	this.currentPage = "/";
}

App.prototype.start = function () {
	this.initializeServiceWorker();
	this.manageNavigation();
	this.initPage();
	window.history.replaceState({ url: this.getPath() }, "");
};

App.prototype.initPage = function () {
	var path = this.getPath();
	var title = "Romain Durand - ";
	if (this.isValidPath(path)) {
		var activeMenuItem = $("#menu a[href='" + path + "']");
		$("#menu a").removeClass("active");
		activeMenuItem.addClass("active");
		title += activeMenuItem.html();
		$("title").html(title);
	}
};

App.prototype.isValidPath = function (path) {
	return this.pageList.find(function (page) {
		return page === path;
	});
};

App.prototype.loadPage = function (path) {
	fetch("page" + path).then(function (response) {
		return response.text();
	}).then(function (textValue) {
		var content = document.getElementById("content");
		var div = document.createElement("div");
		div.innerHTML = textValue;
		content.innerHTML = "";
		content.appendChild(div.childNodes[0]);
		this.initPage();
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
		if (event.ctrlKey || event.button === 1 || event.target.nodeName !== "A") {
			return;
		}
		event.preventDefault();
		var path = new URL(event.target.href).pathname;

		window.history.pushState({ url: path }, "", path);
		this.loadPage(path);
	}.bind(this), false);

	window.onpopstate = function (event) {
		this.loadPage(event.state.url);
	}.bind(this);
};

if (typeof module !== "undefined") module.exports = App;