/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import Third from './third'
import * as Phaser from 'phaser'
import { ThreeGraphicsConfig } from '@enable3d/common/dist/types'
import { WarpedStartFeatures } from '@enable3d/three-graphics/dist/plugins'

export class Scene3D extends Phaser.Scene {
  constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
    super(config)
  }

  /** Access the Third Dimension */
  public third: Third

  /**
   * It takes took long to setup the third dimension your self? Get started with warp speed by using this function.
   * @param features Pass the features you want to setup.
   */
  public async warpSpeed(...features: WarpedStartFeatures[]) {
    return await this.third.warpSpeed(...features)
  }

  public haveSomeFun(numberOfElements: number = 20) {
    this.third.haveSomeFun(numberOfElements)
  }

  /** Place this in the init() function */
  public requestThirdDimension() {
    console.warn(
      '[enable3d] You do not need requestThirdDimension() anymore. Place accessThirdDimension() inside init() instead!'
    )
  }

  /** Place this in the init() function */
  public accessThirdDimension(config: ThreeGraphicsConfig = {}) {
    // set default background color to white
    this.cameras.main.setBackgroundColor(0xffffff)
    // @ts-ignore
    for (let key in this.third) delete this.third[key]
    delete this.third
    // create new third
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
      this.third.animationMixers.update(_delta)
    }
  }
}
