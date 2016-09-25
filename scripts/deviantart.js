// var request = require("request")
// require("request-debug")(request)
var fs = require('fs')
var urlHelpers = require('../lib/url')
var inquirer = require('inquirer')
var dAmn = require('damn')
var uid = require('uid')
var queue = require('queue')
var path = require('path')
var q = queue()
q.concurrency = 1
q.timeout = 5000
q.on('timeout', function (next, job) {
  console.log('job timed out:', job.toString().replace(/\n/g, ''))
  next()
})

var posts = []

fs.readFile(path.join(__dirname, '\\config.json'), 'utf-8', function (err, data) {
  if (err) {
    inputConfig()
    return
  }

  var config = JSON.parse(data)
  if (!config.clientId || !config.clientSecret) {
    inputConfig()
    return
  }

  generatePosts(config)
})
// https://www.deviantart.com/api/v1/oauth2/gallery/1A11B22C-4B93-6A72-98C2-FA12E386D32B?mode=popular&mature_content=true
// https://www.deviantart.com/api/v1/oauth2/gallery/1A11B22C-4B93-6A72-98C2-FA12E386D32B?access_token=a5e4c7bc589397768ce5de38e385d63c27744fff91901df913&offset=0&mature_content=true

function generatePosts (config) {
  dAmn.public(config.clientId, config.clientSecret, function (err, daClient) {
    if (err) {
      console.log(err)
      return
    }
    console.log(daClient)
    // Fetch today's daily deviations
    daClient.matureFilter = false
    daClient.getGalleryFolders({
      username: 'romaindurand'
    }, function (err, data) {
      if (err) {
        console.log(err)
        return
      }
      console.log('Got getGalleryFolders response ! ', data)
      if (!data.results) {
        return
      }
      data.results.filter(folder => folder.name !== 'Featured').forEach(function (folder) {
        // console.log("##", folder)
        getDeviations(folder.folderid, folder.name)
      })
      q.start(function (err) {
        if (err) console.log(err)
        console.log('all done:', posts.length)
        var output = {
          posts: posts.map(function (post) {
            post.id = uid()
            return {
              id: post.id,
              tags: [post.folder],
              title: post.deviation.title,
              timestamp: post.deviation.published_time,
              content: "<a href='" + post.deviation.url + "'><img data-src='" + post.deviation.content.src + "' /></a>",
              preview: "<a href='" + urlHelpers.getPostUrl(post) + "'><img data-src='" + post.deviation.thumbs[2].src + "' /></a>",
              type: 'photo'
            }
          })
        }
        console.log(output)
        fs.writeFileSync('posts.json', JSON.stringify(output), 'utf-8')
      })
    })
    function getDeviations (folderId, folderName, offset) {
      offset = offset || 0
      q.push(function (getFolderDone) {
        daClient.getFolderDeviations({folderId, username: 'romaindurand', offset}, function (err, data) {
          if (err) {
            getDeviations(folderId, folderName, offset)
            getFolderDone()
            return
          }
          if (data.has_more) {
            getDeviations(folderId, folderName, data.next_offset)
          }
          if (data.results) {
            data.results.forEach(function (result) {
              posts.push({
                folder: folderName,
                deviation: result
              })
            })
          }
          // posts = posts.concat(data.results)
          getFolderDone()
        })
      })
    }
  })
}

function inputConfig () {
  inquirer.prompt([
    {
      name: 'clientId',
      message: 'Enter your deviantart Client ID : '
    }, {
      name: 'clientSecret',
      message: 'Enter your deviantart Client secret :'
    }
  ]).then(function (answers) {
    var config = {
      clientId: answers.clientId,
      clientSecret: answers.clientSecret
    }
    fs.writeFileSync('config.json', JSON.stringify(config), 'utf-8')
    generatePosts(config)
  })
}
