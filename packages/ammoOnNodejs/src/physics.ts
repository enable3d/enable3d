/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { AmmoPhysics, Types } from '@enable3d/ammo-physics/dist/index'

export class Physics extends AmmoPhysics {
  constructor(public config: Types.ThreeGraphicsConfig = {}) {
    super('headless', config)
  }
}
