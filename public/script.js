var App = {
	pageList: ["blog", "musique", "dev", ""],
	currentPage: "/",
	start: function() {
		this.initializeServiceWorker();
		this.checkPage();
	},
	checkPage: function() {
		var path = this.getPath();
		if (this.pageList.find(page => "/" + page === path) !== undefined) {
			if (path === this.currentPage) {
				return;
			}
			this.loadPage(path);
		}
	},
	loadPage: function() {
		this.currentPage = this.getPath();
		fetch("page" + this.currentPage)
			.then(response => response.text())
			.then(textValue => {
				var content = document.getElementById("content");
				var div = document.createElement("div");
				div.innerHTML = textValue;
				content.innerHTML = "";
				content.appendChild(div.childNodes[0]);
				console.log("Page loaded : ", this.currentPage);
			});
	},
	getPath: function() {
		return window.location.pathname;
	},
	initializeServiceWorker: function() {
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker
				.register('/service-worker.js')
				.then(function() { console.info('Service worker registered'); });
		}
	}
};
