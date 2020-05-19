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

import * as THREE from '@enable3d/three-wrapper/dist/index'
export { THREE }

import * as Types from '@enable3d/common/dist/types'
export { Types }

export { JoyStick, JoyStickAxis, JoyStickButton } from '@enable3d/common/src/misc/joystick'
export { ThirdPersonControls, ThirdPersonControlsConfig } from '@enable3d/common/src/misc/thirdPersonControls'
export { FirstPersonControls, FirstPersonControlsConfig } from '@enable3d/common/src/misc/firstPersonControls'
export { PointerLock } from '@enable3d/common/src/misc/pointerLock'
export { PointerDrag } from '@enable3d/common/src/misc/pointerDrag'
