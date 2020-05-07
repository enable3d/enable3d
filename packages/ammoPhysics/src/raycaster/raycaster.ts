/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import Physics from '../physics'
import applyMixins from '@enable3d/common/dist/applyMixins'
import ClosestRayResultCallback from './closestRayResultCallback'
import AllHitsRayResultCallback from './allHitsRayResultCallback'

class Raycaster {
  protected _tmpBtVector3: Ammo.btVector3
  protected _btRayFrom: Ammo.btVector3
  protected _btRayTo: Ammo.btVector3
  protected _btRayCallback: any
  protected initCallback: any

  constructor(protected physics: Physics) {}

  setRayFromWorld(x = 0, y = 0, z = 0) {
    this._btRayFrom.setValue(x, y, z)
    this._btRayCallback.set_m_rayFromWorld(this._btRayFrom)
  }

  setRayToWorld(x = 0, y = 0, z = 0) {
    this._btRayTo.setValue(x, y, z)
    this._btRayCallback.set_m_rayToWorld(this._btRayTo)
  }

  hasHit() {
    return this._btRayCallback.hasHit()
  }

  rayTest() {
    this.physics.physicsWorld.rayTest(this._btRayFrom, this._btRayTo, this._btRayCallback)
  }

  destroy() {
    Ammo.destroy(this._tmpBtVector3)
    Ammo.destroy(this._btRayFrom)
    Ammo.destroy(this._btRayTo)
    Ammo.destroy(this._btRayCallback)
  }
}

interface ClosestRaycaster extends Raycaster, ClosestRayResultCallback {}
interface AllHitsRaycaster extends Raycaster, AllHitsRayResultCallback {}

class ClosestRaycaster {
  protected _tmpBtVector3: Ammo.btVector3 = new Ammo.btVector3(0, 0, 0)
  protected _btRayFrom = new Ammo.btVector3(0, 0, 0)
  protected _btRayTo = new Ammo.btVector3(0, 0, 0)

  protected _btRayCallback: Ammo.ClosestRayResultCallback = new Ammo.ClosestRayResultCallback(
    this._tmpBtVector3,
    this._tmpBtVector3
  )

  constructor(protected physics: Physics) {}
}

class AllHitsRaycaster {
  protected _tmpBtVector3: Ammo.btVector3 = new Ammo.btVector3(0, 0, 0)
  protected _btRayFrom = new Ammo.btVector3(0, 0, 0)
  protected _btRayTo = new Ammo.btVector3(0, 0, 0)

  protected _btRayCallback: Ammo.AllHitsRayResultCallback = new Ammo.AllHitsRayResultCallback(
    this._tmpBtVector3,
    this._tmpBtVector3
  )

  constructor(protected physics: Physics) {}
}

applyMixins(ClosestRaycaster, [Raycaster, ClosestRayResultCallback])
applyMixins(AllHitsRaycaster, [Raycaster, AllHitsRayResultCallback])

export { ClosestRaycaster, AllHitsRaycaster }
