const path = require('path')
const optimization = require('./optimization.cjs')

/**
 * Makes the minified bundle
 */
module.exports = env => {
  return {
    mode: 'production',
    stats: 'errors-warnings',
    // devtool: 'source-map',
    entry: path.resolve(__dirname, '../packages/ammoPhysics/src/bundle.ts'),
    output: {
      filename: `enable3d.ammoPhysics.${env.packageVersion}.min.js`,
      path: path.resolve(__dirname, `${env.path}`),
      library: 'ENABLE3D',
      libraryTarget: 'umd'
    },
    resolve: {
      extensions: ['.ts', '.js'],
      extensionAlias: {
        '.js': ['.ts', '.js'],
        '.mjs': ['.mts', '.mjs']
      }
    },
    externals: {
      three: 'THREE',
      phaser: 'Phaser',
      'matter-js': 'Matter',
      'poly-decomp': 'poly-decomp',
      // some externals
      'three/examples/jsm/geometries/ConvexGeometry': 'ConvexGeometry',
      'three/examples/jsm/deprecated/Geometry': 'Geometry'
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          options: {
            configFile: 'packages/ammoPhysics/tsconfig.json'
          }
        }
      ]
    },
    ...optimization
  }
}
