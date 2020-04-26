const path = require('path')

/**
 * Makes the minified bundle
 */
module.exports = (env, argv) => {
  return {
    mode: 'production',
    devtool: 'source-map',
    entry: path.resolve(__dirname, '../packages/ammoPhysics/src/bundle.ts'),
    output: {
      filename: `enable3d.ammoPhysics.${argv.packageVersion}.min.js`,
      path: path.resolve(__dirname, `${argv.path}`),
      library: 'ENABLE3D',
      libraryTarget: 'umd'
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    externals: {
      '@enable3d/three-wrapper/dist/index': 'THREE'
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          options: {
            configFile: 'packages/ammoPhysics/tsconfig.bundle.json'
          }
        }
      ]
    }
  }
}
