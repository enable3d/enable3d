import { ThreeGraphics } from './core'
export { ThreeGraphics }

import { PhysicsLoader } from '@enable3d/common/dist/physicsLoader'
export { PhysicsLoader }

import * as THREE from '@enable3d/three-wrapper/dist/index'
export { THREE }

import * as Types from '@enable3d/common/dist/types'
import { VERSION } from './version'
export { Types }

export {
  WebGLRenderer,
  Texture,
  RGBAFormat,
  GLTFLoader,
  FBXLoader,
  Object3D,
  Vector2,
  Vector3,
  MathUtils
} from '@enable3d/three-wrapper/dist/index'

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
