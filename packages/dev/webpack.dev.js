const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const { resolve } = require('path')

console.log(resolve('../../node_modules/three'))

module.exports = {
  mode: 'development',
  stats: 'errors-warnings',
  devtool: 'inline-source-map',
  entry: './src/game.ts',
  output: {
    filename: '[name].bundle.js',
    pathinfo: false
  },
  devServer: {
    // host: '0.0.0.0'
  },
  resolve: {
    // https://discourse.threejs.org/t/threejs-custom-lib-usage-generate-warning-multiple-instances-of-three-js-being-imported/35292
    // https://github.com/Sean-Bradley/Three.js-TypeScript-Boilerplate/blob/8e415321e554f8505af20f0312e5f3697a26b688/src/client/webpack.common.js#L15-L17
    alias: {
      three: resolve('../../node_modules/three')
    },
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
          transpileOnly: true
        }
      }
    ]
  },
  /*optimization: {
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: {
      chunks: 'all'
    }
  },*/
  plugins: [
    new HtmlWebpackPlugin({ template: './src/index.html' })
    // new CopyPlugin({
    //   patterns: [
    //     { from: 'src/assets', to: 'assets' },
    //     { from: 'lib', to: 'lib' }
    //   ]
    // })
  ]
}
