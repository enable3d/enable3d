export * from 'three'

// deprecated
export { Geometry } from 'three/examples/jsm/deprecated/Geometry'
export { Face3 } from './deprecated.face3'

// custom exports
export { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry'
export { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
export { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader'
export { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory'
export { SVGLoader, SVGResult } from 'three/examples/jsm/loaders/SVGLoader'
export { VRButton } from 'three/examples/jsm/webxr/VRButton'
export { AnimationAction } from 'three/src/animation/AnimationAction'
export { Sky } from 'three/examples/jsm/objects/Sky'
export { Water } from 'three/examples/jsm/objects/Water2'
export { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
export { WEBGL } from 'three/examples/jsm/WebGL'

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
