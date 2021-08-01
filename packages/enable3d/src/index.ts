/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

export { Scene3D } from './scene3d'
export { Project } from './project'
export { PhysicsLoader } from '@enable3d/common/dist/physicsLoader'

export { ExtendedMesh } from '@enable3d/common/dist/extendedMesh'
export { ExtendedObject3D } from '@enable3d/common/dist/extendedObject3D'
export { ExtendedGroup } from '@enable3d/common/dist/extendedGroup'

// experimental flat components
export * as FLAT from '@enable3d/three-graphics/jsm/flat'

// three.js
export * as THREE from 'three'
export * as Types from '@enable3d/common/dist/types'

// misc
export { JoyStick, JoyStickAxis, JoyStickButton } from '@enable3d/common/dist/misc/joystick'
export { ThirdPersonControls, ThirdPersonControlsConfig } from '@enable3d/common/dist/misc/thirdPersonControls'
export { FirstPersonControls, FirstPersonControlsConfig } from '@enable3d/common/dist/misc/firstPersonControls'
export { PointerLock } from '@enable3d/common/dist/misc/pointerLock'
export { PointerDrag } from '@enable3d/common/dist/misc/pointerDrag'

// post-processing
export { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
export { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
export { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
export { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js'
export { DotScreenShader } from 'three/examples/jsm/shaders/DotScreenShader.js'
