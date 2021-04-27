/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { AmmoPhysics } from '../physics'
import { ExtendedObject3D } from '@enable3d/common/dist/types'
import { logger } from '@enable3d/common/dist/logger'

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
    logger('Use getHitPointsWorld() instead of getHitPointWorld() for the AllHitsRayCaster!')
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
    const threeObjects: ExtendedObject3D[] = []
    const objects = this._btRayCallback.get_m_collisionObjects()

    for (let i = objects.size() - 1; i >= 0; i--) {
      // @ts-ignore
      const rb = Ammo.castObject(objects.at(i), Ammo.btRigidBody)
      // @ts-ignore
      threeObjects.push(rb.threeObject)
    }
    return threeObjects
  }
}
