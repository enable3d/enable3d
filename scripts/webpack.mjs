import { spawn } from './spawn.mjs'

const scripts = [
  'cd packages/phaserExtension && npm run bundle',
  'cd packages/ammoPhysics && npm run bundle',
  'cd packages/enable3d && npm run bundle',
  'cd packages/ammoOnNodejs && npm run bundle'
]

for (const script of scripts) {
  console.log('Webpack:', script)
  console.log('\n')

  try {
    await spawn(script)
  } catch (err) {
    process.exit(err)
  }
}
