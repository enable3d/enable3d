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

  getHitPointsWorld() {
    const h = this._btRayCallback.get_m_hitPointWorld() as Ammo.btVector3Array

    const points = []
    for (let i = h.size() - 1; i >= 0; i--) {
      const hh = h.at(i)
      points.push({ x: hh.x(), y: hh.y(), z: hh.z() })
    }

    return points
  }

  // TODO: Remove this in future versions!
  getHitPointWorld() {
    console.warn('[enable3d] Use getHitPointsWorld() instead of getHitPointWorld() for the AllHitsRayCaster!')
    return this.getHitPointsWorld()
  }

  getHitNormalsWorld() {
    const h = this._btRayCallback.get_m_hitNormalWorld()

    const normals = []
    for (let i = h.size() - 1; i >= 0; i--) {
      const hh = h.at(i)
      normals.push({ x: hh.x(), y: hh.y(), z: hh.z() })
    }

    return normals
  }

  getCollisionObjects() {
    const getPtr = (obj: any) => {
      return Object.values(obj)[0]
    }

    const obs: ExtendedObject3D[] = []
    const o = this._btRayCallback.get_m_collisionObjects()
    for (let i = o.size() - 1; i >= 0; i--) {
      const ptr = getPtr(o.at(i))
      // @ts-ignore
      obs.push(this.physics.objectsAmmo[ptr])
    }
    return obs
  }
}
