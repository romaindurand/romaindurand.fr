function App() {
	this.pageList = ["/blog", "/musique", "/dev", "/"];
	this.currentPage = "/";
}

App.prototype.start = function () {
	this.initializeServiceWorker();
	this.currentPage = this.getPath();
	this.manageNavigation();
	this.checkPage();
};
App.prototype.checkPage = function () {
	var path = this.getPath();
	if (this.isValidPath(path)) {
		if (path === this.currentPage) {
			return;
		}
		this.loadPage(path);
	}
};
App.prototype.isValidPath = function (path) {
	return this.pageList.find(function (page) {
		return page === path;
	});
};

App.prototype.loadPage = function (path) {
	this.currentPage = path;
	
	fetch("page" + this.currentPage).then(function (response) {
		return response.text();
	}).then(function (textValue) {
		var content = document.getElementById("content");
		var div = document.createElement("div");
		div.innerHTML = textValue;
		content.innerHTML = "";
		content.appendChild(div.childNodes[0]);
		window.history.pushState({url: this.getPath()}, "", this.currentPage);
	}.bind(this));
};

App.prototype.getPath = function () {
	return window.location.pathname;
};

App.prototype.initializeServiceWorker = function () {
	if ("serviceWorker" in navigator) {
		navigator.serviceWorker
			.register("/service-worker.js")
			.then(function () {
				console.info("Service worker registered");
			});
	}
};

App.prototype.manageNavigation = function () {
	document.addEventListener("click", function() {
		if (event.target.nodeName === "A") {
			event.preventDefault();
			this.loadPage(new URL(event.target.href).pathname);
		}
	}.bind(this), false);
};

if (typeof module !== "undefined") module.exports = App;