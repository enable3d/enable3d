const fs = require('fs')
const path = require('path')

jest.setTimeout(180000)

describe.each([EXAMPLES_PLACEHOLDER])('Example: (%s)', example => {
  let err
  let injected

  // beforeAll(async () => {
  //   await page.goto('https://google.com')
  // })

  beforeEach(async () => {
    err = 0
    injected = false
    // await jestPuppeteer.resetPage()
  })

  it('should inject new script', async done => {
    page.on('error', err => {
      err++
      console.log('error: ', err)
    })

    page.on('requestfailed', err => {
      err++
      console.log('requestfailed:', err._url)
    })

    page.on('pageerror', pageerr => {
      err++
      console.log('pageerror: ', pageerr.message)
    })

    page.on('console', msg => {
      // for (let i = 0; i < msg.args().length; ++i) console.log(`${i}: ${msg.args()[i]}`)
    })

    await page.setRequestInterception(true)

    // the names of the 3 bundle enable3d generates
    const bundles = ['ammoPhysics', 'framework', 'phaserExtension'].map(n => {
      return {
        bundle: n,
        regex: new RegExp(`https://enable3d.io/lib/enable3d/enable3d.${n}.[\\S]+.min.js$`, 'gm')
      }
    })

    const getFile = bundle => {
      const p = path.resolve(__dirname, '../bundles')
      const files = fs.readdirSync(p, 'utf8')
      const regex = new RegExp(`enable3d.${bundle}.[\\S]+.min.js$`, 'gm')
      const file = files.find(el => regex.test(el))
      return fs.readFileSync(path.resolve(__dirname, '../bundles', file), 'utf8')
    }

    page.on('request', async request => {
      let isBundle = false

      bundles.forEach(b => {
        if (b.regex.test(request.url())) {
          isBundle = true
          try {
            const file = getFile(b.bundle)
            request.respond({ body: file })
            injected = true
          } catch {
            request.continue()
          }
        }
      })
      if (!isBundle) request.continue()
    })

    await page.goto(`https://enable3d.io/examples/${example}.html`, {
      // timeout: 60000
      waitUntil: ['load']
    })

    if (injected) {
      // wait for the game to be started
      await page.waitForTimeout(10000)
      // await page.screenshot({ path: path.resolve(__dirname, `../screenshots/${example}.png`) })
      done()
    } else done(new Error('Could not inject script'))
  })

  it('the page should not have any errors"', async () => {
    await expect(err).toEqual(0)
  })
})
