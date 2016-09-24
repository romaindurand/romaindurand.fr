module.exports = {
  getFiltersFromTags: function (allowedTags, requestedTags) {
    if (allowedTags[0] === undefined) {
      return {}
    }
    return {
      tags: allowedTags.map(function (allowedTag) {
        var queryString = allowedTags.filter(function (queryTag) {
          if (queryTag === allowedTag) {
            return !requestedTags.includes(queryTag)
          }
          return requestedTags.includes(queryTag)
        }).join(',')
        var result = {
          tag: allowedTag,
          query: '?tags=' + queryString,
          active: requestedTags.includes(allowedTag)
        }
        // requestedTags.includes(allowedTag)
        return result
      })
    }
  }
}
