const path = require('path')

module.exports = {
  entry: './src/examples.ts',
  devtool: 'source-map',
  output: {
    filename: 'examples.js',
    path: path.resolve(__dirname, 'dist')
  },
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      { test: /\.tsx?$/, loader: 'ts-loader' }
    ]
  }
}
