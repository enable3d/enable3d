// https://github.com/evanw/esbuild/issues/727

import * as esbuild from 'esbuild'

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
  outfile: 'bundlesTest/www/build.module.js',
  platform: 'browser',
  format: 'esm',
  minify: true,
  plugins: [threeAsExtern()]
})
