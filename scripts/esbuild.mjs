// https://github.com/evanw/esbuild/issues/727

import * as esbuild from 'esbuild'
import PKG_VERSION from './version.cjs'
console.log(PKG_VERSION)

/**
 * Will load all "three" imports as external modules.
 * "three/**" modules will still be included in the bundle.
 * @returns
 */
function threeAsExtern() {
  return {
    name: 'three-extern-plugin',
    setup(build) {
      build.onResolve({ filter: /^three$/ }, args => {
        if (args.kind === 'import-statement') {
          return { path: args.path, external: true }
        }
      })
    }
  }
}

await esbuild.build({
  entryPoints: ['packages/ammoPhysics/src/index.ts'],
  bundle: true,
  outfile: 'bundles/enable3d.ammoPhysics.' + PKG_VERSION + '.module.min.js',
  platform: 'browser',
  format: 'esm',
  minify: true,
  plugins: [threeAsExtern()]
})

await esbuild.build({
  entryPoints: ['packages/enable3d/src/index.ts'],
  bundle: true,
  outfile: 'bundles/enable3d.framework.' + PKG_VERSION + '.module.min.js',
  platform: 'browser',
  format: 'esm',
  minify: true
})
