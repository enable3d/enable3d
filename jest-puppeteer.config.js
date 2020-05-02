module.exports = {
  launch: {
    headless: true,
    args: ['--disable-gpu', '--no-sandbox', '--disable-setuid-sandbox'],
    ignoreDefaultArgs: ['--disable-extensions']
    // dumpio: true
    // slowMo: 250
  }
}
