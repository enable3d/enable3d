const path = require('path')
const optimization = require('../../webpack/optimization.cjs')

module.exports = {
  mode: 'production',
  stats: 'errors-warnings',
  entry: './src/index.ts',
  target: 'node',
  // devtool: 'source-map',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [{ test: /\.tsx?$/, loader: 'ts-loader' }]
  },
  ...optimization
}
