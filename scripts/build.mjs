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
    const cmd = pkg !== 'ammoOnNodejs' ? 'tsc' : 'npm run build'
    await spawn(`cd packages/${pkg} && ${cmd}`)
  } catch (err) {
    process.exit(err)
  }
}
