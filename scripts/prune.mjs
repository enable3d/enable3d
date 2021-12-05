import { spawn } from './spawn.mjs'

const prune = {
  'node-modules': "find . -name 'node_modules' -type d -prune -exec rm -rf '{}' +",
  dist: "find . -name 'dist' -type d -prune -exec rm -rf '{}' +",
  lock: 'rm -rf package-lock.json'
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
