/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|LGPL-3.0}
 */

// export { Ammo } from './ammo'
export { Physics } from './physics.js'

import { FBXLoader, GLTFLoader } from './loaders.js'
export const Loaders = { GLTFLoader, FBXLoader }

export { ServerClock } from '@enable3d/common/dist/serverClock.js'

export { ExtendedMesh } from '@enable3d/common/dist/extendedMesh.js'
export { ExtendedObject3D } from '@enable3d/common/dist/extendedObject3D.js'
