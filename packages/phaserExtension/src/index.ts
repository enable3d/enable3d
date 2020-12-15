/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

export { Scene3D } from './scene3d'
export { enable3d } from './enable3d'
export { PhysicsLoader } from '@enable3d/common/dist/physicsLoader'

import Canvas from '@enable3d/common/dist/customCanvas'
export { Canvas }

export { ExtendedMesh } from '@enable3d/common/dist/extendedMesh'
export { ExtendedObject3D } from '@enable3d/common/dist/extendedObject3D'
export { ExtendedGroup } from '@enable3d/common/dist/extendedGroup'

import * as THREE from '@enable3d/three-wrapper/dist/index'
export { THREE }

import * as Types from '@enable3d/common/dist/types'
export { Types }

export { JoyStick, JoyStickAxis, JoyStickButton } from '@enable3d/common/dist/misc/joystick'
export { ThirdPersonControls, ThirdPersonControlsConfig } from '@enable3d/common/dist/misc/thirdPersonControls'
export { FirstPersonControls, FirstPersonControlsConfig } from '@enable3d/common/dist/misc/firstPersonControls'
export { PointerLock } from '@enable3d/common/dist/misc/pointerLock'
export { PointerDrag } from '@enable3d/common/dist/misc/pointerDrag'

// post-processing
export { EffectComposer, RenderPass, ShaderPass, GlitchPass, DotScreenShader } from '@enable3d/three-wrapper/dist/index'
