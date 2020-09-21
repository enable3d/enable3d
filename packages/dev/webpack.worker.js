const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  target: 'node', 
  entry: {
    bundle: './src-offscreen/index.js',
    worker: './src-offscreen/offscreen.js'
  },
  output: {
    filename: '[name].js',
    pathinfo: false,
    globalObject: "this"
  },
  devServer: {
    port: 8081
  },
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          transpileOnly: true,
          experimentalWatchApi: true
        }
      }
    ]
  },
  // optimization: {
  //   removeAvailableModules: false,
  //   removeEmptyChunks: false,
  //   splitChunks: {
  //     chunks: 'all'
  //   }
  // },
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1
    }),
    new HtmlWebpackPlugin({ template: './src-offscreen/index.html' }),
    new CopyPlugin([{ from: 'src-offscreen/assets', to: 'assets' }])
  ]
}
