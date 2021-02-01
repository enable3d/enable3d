export * from 'three'

import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry'
export { ConvexGeometry }

// TODO(yandeu) Remove this soon.
import { Geometry } from 'three/examples/jsm/deprecated/Geometry'
export { Geometry }

// TODO(yandeu) Try to remove soon.
import { Face3 } from './deprecated.face3'
export { Face3 }

import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
export { FBXLoader }

import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader'
export { GLTFLoader, GLTF }

import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory'
export { XRControllerModelFactory }

import { SVGLoader, SVGResult } from 'three/examples/jsm/loaders/SVGLoader'
export { SVGLoader, SVGResult }

import { VRButton } from 'three/examples/jsm/webxr/VRButton'
export { VRButton }

import { AnimationAction } from 'three/src/animation/AnimationAction'
export { AnimationAction }

import { Sky } from 'three/examples/jsm/objects/Sky'
export { Sky }

import { Water } from 'three/examples/jsm/objects/Water2'
export { Water }

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
export { OrbitControls }

import { WEBGL } from 'three/examples/jsm/WebGL'
export { WEBGL }

// post-processing
export { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
export { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
export { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
export { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js'
export { DotScreenShader } from 'three/examples/jsm/shaders/DotScreenShader.js'

import { REVISION } from 'three'

const info = `Three.js r${REVISION}`
console.log(
  `%c %c %c %c %c ${info} %c https://threejs.org/`,
  'background: #ff0000',
  'background: #ffff00',
  'background: #00ff00',
  'background: #00ffff',
  'color: #fff; background: #000000;',
  'background: none'
)
