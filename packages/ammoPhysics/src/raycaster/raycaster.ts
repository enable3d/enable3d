/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|LGPL-3.0}
 */

import applyMixins from '@enable3d/common/dist/applyMixins.js'
import ClosestRayResultCallback from './closestRayResultCallback.js'
import AllHitsRayResultCallback from './allHitsRayResultCallback.js'
import { AmmoPhysics } from '../physics.js'

class Raycaster {
  public readonly type!: string
  protected _btRayFrom!: Ammo.btVector3
  protected _btRayTo!: Ammo.btVector3
  protected _btRayCallback!: Ammo.RayResultCallback

  constructor(protected physics: AmmoPhysics) {}

  setRayFromWorld(x = 0, y = 0, z = 0) {
    this._btRayFrom.setValue(x, y, z)
  }

  setRayToWorld(x = 0, y = 0, z = 0) {
    this._btRayTo.setValue(x, y, z)
  }

  hasHit() {
    return this._btRayCallback.hasHit()
  }

  rayTest() {
    if (typeof this._btRayCallback !== 'undefined') Ammo.destroy(this._btRayCallback)

    this._btRayCallback =
      this.type === 'closest'
        ? new Ammo.ClosestRayResultCallback(this._btRayFrom, this._btRayTo)
        : new Ammo.AllHitsRayResultCallback(this._btRayFrom, this._btRayTo)

    this.physics.physicsWorld.rayTest(this._btRayFrom, this._btRayTo, this._btRayCallback)
  }

  destroy() {
    if (typeof this._btRayFrom !== 'undefined') Ammo.destroy(this._btRayFrom)
    if (typeof this._btRayTo !== 'undefined') Ammo.destroy(this._btRayTo)
    if (typeof this._btRayCallback !== 'undefined') Ammo.destroy(this._btRayCallback)
  }
}

interface ClosestRaycaster extends Raycaster, ClosestRayResultCallback {}
interface AllHitsRaycaster extends Raycaster, AllHitsRayResultCallback {}

class ClosestRaycaster implements Raycaster, ClosestRayResultCallback {
  public readonly type = 'closest'
  protected _btRayFrom = new Ammo.btVector3(0, 0, 0)
  protected _btRayTo = new Ammo.btVector3(0, 0, 0)
  protected _btRayCallback!: Ammo.ClosestRayResultCallback

  constructor(protected physics: AmmoPhysics) {}
}

class AllHitsRaycaster implements Raycaster, AllHitsRayResultCallback {
  public readonly type = 'allHits'
  protected _btRayFrom = new Ammo.btVector3(0, 0, 0)
  protected _btRayTo = new Ammo.btVector3(0, 0, 0)
  protected _btRayCallback!: Ammo.AllHitsRayResultCallback

  constructor(protected physics: AmmoPhysics) {}
}

applyMixins(ClosestRaycaster, [Raycaster, ClosestRayResultCallback])
applyMixins(AllHitsRaycaster, [Raycaster, AllHitsRayResultCallback])

export { ClosestRaycaster, AllHitsRaycaster }
