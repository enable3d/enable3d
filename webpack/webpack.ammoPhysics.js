const path = require('path')

/**
 * Makes the minified bundle
 */
module.exports = (env) => {
  return {
    mode: 'production',
    devtool: 'source-map',
    entry: path.resolve(__dirname, '../packages/ammoPhysics/src/bundle.ts'),
    output: {
      filename: `enable3d.ammoPhysics.${env.packageVersion}.min.js`,
      path: path.resolve(__dirname, `${env.path}`),
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
