import { join, resolve } from 'path'
import { spawn } from './spawn.mjs'

const packages = ['threeWrapper', 'common', 'ammoPhysics', 'threeGraphics', 'phaserExtension', 'enable3d']

for (const pkg of packages) {
  console.log('Compile:', join(resolve(), 'packages', pkg))
  console.log('\n')

  try {
    await spawn(`cd packages/${pkg} && tsc`)
  } catch (err) {
    process.exit(err)
  }
}
