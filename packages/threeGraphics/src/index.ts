export { ThreeGraphics } from './core'
export { PhysicsLoader } from '@enable3d/common/dist/physicsLoader'
export * as Types from '@enable3d/common/dist/types'

import { VERSION } from './version'

const info = `Powered by enable3d v${VERSION}`
console.log(
  `%c %c %c %c %c ${info} %c https://enable3d.io/`,
  'background: #ff0000',
  'background: #ffff00',
  'background: #00ff00',
  'background: #00ffff',
  'color: #fff; background: #000000;',
  'background: none'
)
