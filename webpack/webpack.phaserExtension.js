const path = require('path')
/**
 * Makes the minified bundle
 */
module.exports = env => {
  return {
    mode: 'production',
    devtool: 'source-map',
    entry: path.resolve(__dirname, '../packages/phaserExtension/src/bundle.ts'),
    output: {
      filename: `enable3d.phaserExtension.${env.packageVersion}.min.js`,
      path: path.resolve(__dirname, `${env.path}`),
      library: 'ENABLE3D',
      libraryTarget: 'umd'
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    externals: {
      phaser: 'Phaser',
      'matter-js': 'Matter',
      'poly-decomp': 'poly-decomp'
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          options: {
            configFile: 'packages/phaserExtension/tsconfig.bundle.json'
          }
        }
      ]
    }
  }
}
