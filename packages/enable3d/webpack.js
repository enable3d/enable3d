const path = require('path')

/**
 * Makes the minified bundle
 */
module.exports = (env, argv) => {
  return {
    mode: 'production',
    entry: path.resolve(__dirname, './src/index.ts'),
    output: {
      path: path.resolve(__dirname, `${argv.path}`),
      filename: `enable3d.${argv.packageVersion}.min.js`,
      library: 'ENABLE3D',
      libraryTarget: 'umd'
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader'
        }
      ]
    }
  }
}
