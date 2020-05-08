/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { ThreeGraphics } from './index'
import { Clock } from '@enable3d/three-wrapper/dist/index'
import { Phaser3DConfig } from '@enable3d/common/dist/types'

class ThreeScene extends ThreeGraphics {
  private then: number = 0
  public clock: Clock

  constructor(config: Phaser3DConfig = {}) {
    super(config)
    this._init()
  }

  public init() {}
  public preload() {}
  public create() {}
  public update(_time: number, _delta: number) {}

  private async _init() {
    this.clock = new Clock()

    this.renderer.setSize(window.innerWidth, window.innerHeight)

    const div = document.createElement('div')
    div.id = 'three-scene'
    document.body.appendChild(div)
    document.getElementById('three-scene')?.appendChild(this.renderer.domElement)

    await this.init?.()
    await this._preload()
    await this._create()

    this.renderer.setAnimationLoop(() => {
      this._update()
    })
  }

  private async _preload() {
    await this.preload?.()
  }

  private async _create() {
    await this.create?.()
  }

  private _update() {
    const delta = this.clock.getDelta() * 1000
    const time = this.clock.getElapsedTime()

    this.update?.(parseFloat(time.toFixed(3)), parseInt(delta.toString()))
    this.physics.update(delta)
    this.physics.updateDebugger()
    this.renderer.render(this.scene, this.camera)
  }
}

export { ThreeScene }
