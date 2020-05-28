/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { AmmoPhysics } from '../physics'
import { ExtendedObject3D } from '@enable3d/common/dist/types'

export default class AllHitsRayResultCallback {
  protected _btRayCallback: Ammo.AllHitsRayResultCallback

  constructor(protected physics: AmmoPhysics) {}

  getHitPointWorld(): { x: number; y: number; z: number }[] {
    const h = this._btRayCallback.get_m_hitPointWorld() as Ammo.btVector3Array

    const points = []
    for (let i = h.size() - 1; i >= 0; i--) {
      const hh = h.at(i)
      points.push({ x: hh.x(), y: hh.y(), z: hh.z() })
    }

    return points
  }

  getCollisionObjects(): ExtendedObject3D[] {
    const getPtr = (obj: any) => {
      return Object.values(obj)[0]
    }

    const obs = []
    // @ts-ignore
    const o = this._btRayCallback.get_m_collisionObjects()
    for (let i = o.size() - 1; i >= 0; i--) {
      const ptr = getPtr(o.at(i))
      // @ts-ignore
      obs.push(this.physics.objectsAmmo[ptr])
    }
    return obs
  }
}
