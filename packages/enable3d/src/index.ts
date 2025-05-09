/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|LGPL-3.0}
 */

export { Scene3D } from './scene3d.js'
export { Project } from './project.js'
export { PhysicsLoader } from '@enable3d/common/dist/physicsLoader.js'

export { ExtendedMesh } from '@enable3d/common/dist/extendedMesh.js'
export { ExtendedObject3D } from '@enable3d/common/dist/extendedObject3D.js'
export { ExtendedGroup } from '@enable3d/common/dist/extendedGroup.js'

// export enable3d version
export { VERSION } from '@enable3d/three-graphics/dist/version.js'

// experimental flat components
export * as FLAT from '@enable3d/three-graphics/dist/flat/index.js'

// three.js
export * as THREE from 'three'
export * as Types from '@enable3d/common/dist/types.js'

// misc
export { JoyStick } from '@enable3d/common/dist/misc/joystick.js'
export { ThirdPersonControls, ThirdPersonControlsConfig } from '@enable3d/common/dist/misc/thirdPersonControls.js'
export { FirstPersonControls, FirstPersonControlsConfig } from '@enable3d/common/dist/misc/firstPersonControls.js'
export { FlyControls, FlyControlsConfig } from '@enable3d/common/dist/misc/flyControls.js'
export { PointerLock } from '@enable3d/common/dist/misc/pointerLock.js'
export { PointerDrag } from '@enable3d/common/dist/misc/pointerDrag.js'

// post-processing
export { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
export { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
export { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
export { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js'
export { DotScreenShader } from 'three/examples/jsm/shaders/DotScreenShader.js'
