/**
 * Get the package version from the lerna.json file.
 */
const pkg = require('../lerna.json')
const PKG_VERSION = pkg.version
module.exports = PKG_VERSION
