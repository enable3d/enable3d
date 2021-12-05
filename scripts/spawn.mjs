import { spawn as _spawn } from 'child_process'

export const spawn = command => {
  return new Promise((resolve, reject) => {
    const s = _spawn(command, {
      shell: true,
      stdio: 'inherit'
    })

    s.on('close', code => {
      if (code !== 0) return reject(code)
      return resolve()
    })
  })
}
