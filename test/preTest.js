const os = require('os')
const fs = require('fs')
const path = require('path')
const https = require('https')

// fetch a url
const get = url => {
  return new Promise((resolve, reject) => {
    https
      .get(url, res => {
        // console.log('statusCode:', res.statusCode)
        // console.log('headers:', res.headers)
        let chunks = []

        res
          .on('data', d => {
            chunks.push(d)
            // process.stdout.write(d)
          })
          .on('end', () => {
            resolve(Buffer.concat(chunks).toString())
          })
          .on('error', error => {
            reject(error)
          })
      })
      .on('error', e => {
        console.error(e)
      })
  })
}

// get the regex match for all example names
const getExamples = async () => {
  const re = /\.\/examples\/([a-z0-9-]+)\.html/g
  const html = await get('https://enable3d.io/examples.html')

  let examples = []

  let m
  do {
    m = re.exec(html)
    if (m) {
      examples.push(m[1])
    }
  } while (m)

  // TODO: It excludes headless examples for now
  return examples.filter(e => !/^headless/.test(e))
}

const createScreenshotsDirectory = () => {
  const dir = path.resolve(__dirname, '../screenshots')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
}

const main = async () => {
  createScreenshotsDirectory()

  const examples = await getExamples()
  const template = fs.readFileSync(path.resolve(__dirname, './template.js'), { encoding: 'utf8' })

  examples.forEach(e => {
    const t = template.replace('EXAMPLES_PLACEHOLDER', `'${e}'`)
    fs.writeFileSync(path.resolve(__dirname, `${e.trim()}.tmp.test.js`), t)
  })
}

main()
