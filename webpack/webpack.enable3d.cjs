const path = require('path')
const optimization = require('./optimization.cjs')
const { resolve } = require('path')

console.log(resolve('../../node_modules/three'))

/**
 * Makes the minified bundle
 */
module.exports = env => {
  return {
    mode: 'production',
    stats: 'errors-warnings',
    // devtool: 'source-map',
    entry: path.resolve(__dirname, '../packages/enable3d/src/bundle.ts'),
    output: {
      filename: `enable3d.framework.${env.packageVersion}.min.js`,
      path: path.resolve(__dirname, `${env.path}`),
      library: 'ENABLE3D',
      libraryTarget: 'umd'
    },
    resolve: {
      // https://discourse.threejs.org/t/threejs-custom-lib-usage-generate-warning-multiple-instances-of-three-js-being-imported/35292
      // https://github.com/Sean-Bradley/Three.js-TypeScript-Boilerplate/blob/8e415321e554f8505af20f0312e5f3697a26b688/src/client/webpack.common.js#L15-L17
      alias: {
        three: resolve('../../node_modules/three')
      },
      // Add `.ts` and `.tsx` as a resolvable extension.
      extensions: ['.ts', '.tsx', '.js'],
      extensionAlias: {
        '.js': ['.ts', '.js'],
        '.mjs': ['.mts', '.mjs']
      }
    },
    externals: {
      // three: 'THREE',
      phaser: 'Phaser',
      'matter-js': 'Matter',
      'poly-decomp': 'poly-decomp'
      // some externals
      // 'three/examples/jsm/geometries/ConvexGeometry': 'ConvexGeometry',
      // 'three/examples/jsm/deprecated/Geometry': 'Geometry'
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          options: {
            configFile: 'packages/enable3d/tsconfig.bundle.json'
          }
        }
      ]
    },
    ...optimization
  }
}
