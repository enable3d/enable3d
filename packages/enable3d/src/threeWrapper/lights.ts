/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2019 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { DirectionalLight, HemisphereLight, Scene, AmbientLight } from 'three'

export default class Lights {
  public scene: Scene

  protected addDirectionalLight({ color = 0xffffff, intensity = 1, x = 0, y = 0, z = 0 } = {}) {
    const light = new DirectionalLight(color, intensity)
    light.position.set(x, y, z)
    light.castShadow = true
    this.scene.add(light)
    return light
  }

  protected addHemisphereLight({ skyColor = 0xffffff, groundColor = 0x000000, intensity = 1 } = {}) {
    const light = new HemisphereLight(skyColor, groundColor, intensity)
    this.scene.add(light)
    return light
  }

  protected addAmbientLight({ color = 0xffffff, intensity = 1 } = {}) {
    const light = new AmbientLight(color, intensity)
    this.scene.add(light)
    return light
  }
}
