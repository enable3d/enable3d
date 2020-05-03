/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import Third from './third'
import * as Phaser from 'phaser'
import Cameras from '@enable3d/three-graphics/dist/cameras'
import loadAmmoModule from '@enable3d/common/dist/wasmLoader'
import Canvas from '@enable3d/common/dist/customCanvas'
import { Phaser3DConfig } from '@enable3d/common/dist/types'

export * from '@enable3d/common/dist/types'
export { Cameras }
export { Third }
export { Canvas }

import { THREE } from '@enable3d/three-graphics/dist/index'
export { THREE }

import * as Types from '@enable3d/common/dist/types'
export { Types }

export class Scene3D extends Phaser.Scene {
  constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
    super(config)
  }

  /** Access the Third Dimension */
  public third: Third

  /** Place this in the init() function */
  public requestThirdDimension() {
    // set default background color to white
    this.cameras.main.setBackgroundColor(0xffffff)
    // @ts-ignore
    for (let key in this.third) delete this.third[key]
    delete this.third
  }
  /** Place this in the init() function */
  public accessThirdDimension(config: Phaser3DConfig = {}) {
    this.third = new Third(this, config)
  }

  /** Combines the 3 XR update methods */
  public updateLoopXR(time: number, delta: number) {
    this.preUpdateXR(time, delta)
    this.updateXR(time, delta)
    this.postUpdateXR(time, delta)
  }

  /** Pre-Update the WebXR */
  private preUpdateXR(_time: number, _delta: number) {}

  /** Update the WebXR. Use this to update your game loop in XR mode instead the normal update method provided by phaser.
   * It will overwrite the default Phaser clock and do some other things behind the scene for you.
   */
  public updateXR(_time: number, _delta: number) {}

  /** Post-Update the WebXR */
  private postUpdateXR(_time: number, _delta: number) {
    if (this.third.isXrEnabled) {
      // overwrite the default phaser clock
      this.time.update(_time, _delta)
      // manually update the physics
      this.third.physics.update(_delta)
      // manually update physics debugger
      this.third.physics.updateDebugger()
      // manually update the mixers
      this.third.mixers.update(_delta)
    }
  }
}

window.__loadPhysics = false
window.__ammoPath = ''

/** Discover a whole new dimension wrapping your Phaser game with enable3d */
export const enable3d = (ready: Function) => {
  window.setTimeout(() => {
    if (window.__loadPhysics) {
      loadAmmoModule(window.__ammoPath, () => {
        Ammo().then(() => {
          ready()
        })
      })
    } else {
      ready()
    }
  }, 50)
  return {
    withPhysics(path: string) {
      window.__loadPhysics = true
      window.__ammoPath = path
    }
  }
}

export default enable3d
