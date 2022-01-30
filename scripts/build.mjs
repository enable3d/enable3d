import { join, resolve } from 'path'
import { spawn } from './spawn.mjs'

const packages = [
  'threeWrapper',
  'common',
  'ammoPhysics',
  'threeGraphics',
  'phaserExtension',
  'enable3d',
  'ammoOnNodejs'
]

for (const pkg of packages) {
  console.log('Building:', join(resolve(), 'packages', pkg))
  console.log('\n')

  try {
    await spawn(`cd packages/${pkg} &&  npm run build`)
  } catch (err) {
    process.exit(err)
  }
}
