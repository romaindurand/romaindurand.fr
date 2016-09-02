module.exports = {
	getPostUrl: function (post) {
		var title = post.deviation.title.replace(/[. ]/g, "-"); 
		return "/article/" + post.id + "-" + title;
	}
};