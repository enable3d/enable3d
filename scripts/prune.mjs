import { spawn } from './spawn.mjs'

const prune = {
  'node-modules': 'npx -y rimraf node_modules && npx -y rimraf packages/**/node_modules',
  dist: 'npx -y rimraf packages/**/dist',
  lock: 'npx -y rimraf package-lock.json'
}

for (const [key, script] of Object.entries(prune)) {
  console.log('Prune:', key)
  console.log('\n')

  try {
    await spawn(script)
  } catch (err) {
    process.exit(err)
  }
}
