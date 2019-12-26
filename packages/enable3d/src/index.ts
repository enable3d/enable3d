/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2019 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import ThirdDimension from './thirdDimension'
import Cameras from './threeWrapper/cameras'
import loadAmmoModule from './helpers/wasmLoader'
import { Phaser3DConfig } from './types'

export * from './types'
export { Cameras }
export { ThirdDimension }

export class Scene3D extends Phaser.Scene {
  constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
    super(config)
  }

  /** Access the Third Dimension */
  public third: ThirdDimension

  /** Place this in the init() function */
  public requestThirdDimension() {
    // @ts-ignore
    for (let key in this.third) delete this.third[key]
    delete this.third
  }
  /** Place this in the init() function */
  public accessThirdDimension(config: Phaser3DConfig = {}) {
    this.third = new ThirdDimension(this, config)
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
