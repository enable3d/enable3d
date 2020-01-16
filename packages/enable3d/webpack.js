const path = require('path')

/**
 * Makes the minified bundle
 */
module.exports = (env, argv) => {
  return {
    mode: 'production',
    entry: path.resolve(__dirname, './src/bundle.ts'),
    output: {
      filename: `enable3d.${argv.packageVersion}.main.min.js`,
      chunkFilename: `enable3d.${argv.packageVersion}.[name].min.js`,
      path: path.resolve(__dirname, `${argv.path}`),
      publicPath: '/lib/',
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
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env'],
                plugins: ['@babel/plugin-syntax-dynamic-import']
              }
            },
            'ts-loader'
          ],
          exclude: /node_modules/
        }
      ]
    }
  }
}
