let App = {
    pageList: ["blog", "musique", "dev", ""],
    currentPage: "/",
    start() {
        this.checkPage();
    },
    checkPage() {
        let path = this.getPath();
        if (this.pageList.find(page=>"/" + page === path) !== undefined) {
            if (path === this.currentPage) {
                return;
            }
            this.loadPage(path);
        }
    },
    loadPage() {
        this.currentPage = this.getPath();
        fetch("page" + this.currentPage)
        .then(response=>response.text())
        .then(textValue => {
            let content = document.getElementById("content");
            var div = document.createElement("div");
            div.innerHTML = textValue;
            content.innerHTML = "";
            content.appendChild(div.childNodes[0]);
            console.log("Page loaded : ", this.currentPage);
        });
    },
    getPath() {
        return window.location.pathname;
    }
};
