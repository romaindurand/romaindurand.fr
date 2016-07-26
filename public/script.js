function App() {
	this.pageList = ["blog", "musique", "dev", ""];
	this.currentPage = "/";
}

App.prototype.start = function () {
	this.initializeServiceWorker();
	this.checkPage();
};
App.prototype.checkPage = function () {
	var path = this.getPath();
	if (this.isValidPage(path)) {
		if (path === this.currentPage) {
			return;
		}
		this.loadPage(path);
	}
};
App.prototype.isValidPage = function (path) {
	return this.pageList.find(function (page) {
		return ("/" + page === path) !== undefined;
	});
};

App.prototype.loadPage = function () {
	this.currentPage = this.getPath();
	fetch("page" + this.currentPage).then(function (response) {
		return response.text();
	}).then(function (textValue) {
		var content = document.getElementById("content");
		var div = document.createElement("div");
		div.innerHTML = textValue;
		content.innerHTML = "";
		content.appendChild(div.childNodes[0]);
		console.log("Page loaded : ", this.currentPage);
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
