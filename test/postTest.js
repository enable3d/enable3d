const path = require('path')
const fs = require('fs')

const directoryPath = path.join(__dirname)
fs.readdir(directoryPath, function (err, files) {
  if (err) {
    return console.log('Unable to scan directory: ' + err)
  }

  files.forEach(function (file) {
    if (/\.test\.js$/.test(file)) {
      fs.unlink(path.join(__dirname, file), err => {
        if (err) {
          console.error(err)
          return
        }
        //file removed
      })
    }
  })
})
