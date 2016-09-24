/* globals $,_ */
function App () {
  this.pageList = [
    {
      path: '/',
      menuLabel: 'Accueil',
      title: ''
    },
    {
      path: '/dev',
      menuLabel: '/dev'
    },
    {
      path: '/musique',
      menuLabel: 'Musique'
    },
    {
      path: '/blog',
      menuLabel: 'Blog'
    },
    {
      path: '/gallerie',
      menuLabel: 'Gallerie'
    }
  ]
  this.taglines = [
    'Obviously not a web design blog'
  ]
}

App.prototype.start = function () {
  this.initializeServiceWorker()
  this.manageNavigation()
  this.managePostsLoading()
  window.history.replaceState({ url: this.getPath() }, '')
}

App.prototype.loadVisiblePosts = function () {
  var currentIndex
  var imagesListLength = $('img[data-src]').length
  $('img[data-src]').toArray().reverse().every(function (image, idx) {
    if ($(image).attr('src')) {
      return true
    }
    idx = imagesListLength - idx
    if (isScrolledIntoView(image)) {
      currentIndex = idx
      return false
    }
    return true
  }, this)
  for (var i = 0; i < currentIndex; i++) {
    var images = $('img[data-src]')
    var loadingImage = images.eq(i)
    if (loadingImage.attr('src')) {
      continue
    }
    loadingImage.attr('src', loadingImage.data('src'))
  }

  function isScrolledIntoView (elem) {
    var docViewTop = $(window).scrollTop()
    var docViewBottom = docViewTop + $(window).height()
    var elemTop = $(elem).offset().top
    var elemBottom = elemTop + $(elem).height()
    return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop))
  }
}

App.prototype.managePostsLoading = function () {
  $(document).scroll(_.throttle(this.loadVisiblePosts, 300))
  this.loadVisiblePosts()
}

App.prototype.updatePageTitle = function () {
  var path = this.getPath()
  if (this.isValidPath(path)) {
    var activeMenuItem = $("#menu a[href='" + path.split('?')[0] + "']")
    $('#menu li').removeClass('active')
    activeMenuItem.parent().addClass('active')
    $('title').html(this.getTitle(path))
  }
}

App.prototype.getTitle = function (path) {
  var page = this.pageList.find(function (page) {
    return path.startsWith(page.path)
  })
  var pageTitle = page.title || page.menuLabel
  return 'Romain Durand' + (pageTitle ? ' - ' + pageTitle : '')
}

App.prototype.getTagline = function () {
  var index = ~~(Math.random() * this.taglines.length)
  return this.taglines[index]
}

App.prototype.isValidPath = function (path) {
  return !!this.pageList.find(function (page) {
    return path.startsWith(page.path)
  })
}

App.prototype.loadPage = function (path, scrollTop) {
  fetch('page' + path).then(function (response) {
    return response.text()
  }).then(function (textValue) {
    var content = $('#content')
    content.html(textValue)
    this.updatePageTitle()
    this.loadVisiblePosts()
    $(window).scrollTop(scrollTop)
  }.bind(this))
}

App.prototype.getPath = function () {
  return window.location.pathname + window.location.search
}

App.prototype.initializeServiceWorker = function () {
  if (!('serviceWorker' in navigator)) {
    return
  }
  navigator.serviceWorker
    .register('/service-worker.js')
    .then(function () {
      console.info('Service worker registered')
    })
}

App.prototype.manageNavigation = function () {
  var _this = this
  $(document).on('click', 'a', function (event) {
    if (event.ctrlKey || event.button === 1 || event.button === 2) {
      return
    }

    event.preventDefault()
    if (this.hostname !== window.location.hostname) {
      window.open($(this).attr('href'))
      return
    }

    var path = this.pathname + this.search
    window.history.replaceState({ url: _this.getPath(), scrollTop: $(window).scrollTop() }, '')
    window.history.pushState({
      url: path
    }, '', path)
    _this.loadPage(path, 0)
  })

  window.onpopstate = function (event) {
    this.loadPage(event.state.url, event.state.scrollTop)
  }.bind(this)
}

if (typeof module !== 'undefined') module.exports = App
