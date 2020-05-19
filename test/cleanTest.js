const path = require('path')
const fs = require('fs')

// remove all .tmp.test.js files
let testsPaths = path.resolve(__dirname)
fs.readdir(testsPaths, function(err, files) {
  if (err) {
    return console.log('Unable to scan directory: ' + err)
  }

  files.forEach(function(file) {
    if (/\.tmp\.test\.js$/.test(file)) {
      fs.unlink(path.join(testsPaths, file), err => {
        if (err) {
          console.error(err)
          return
        }
        //file removed
      })
    }
  })
})
