/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2019 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { Scene } from 'phaser'
import { PerspectiveCamera, OrthographicCamera } from '../types'
import {
  PerspectiveCamera as THREE_PerspectiveCamera,
  OrthographicCamera as THREE_OrthographicCamera
} from 'three/src/Three'

export default class Cameras {
  constructor(public root: Scene) {}
  static PerspectiveCamera(scene: Scene, config: PerspectiveCamera = {}): THREE.PerspectiveCamera {
    const { fov = 50, aspect = scene.scale.gameSize.aspectRatio, near = 0.1, far = 2000, x = 0, y = 0, z = 0 } = config
    const camera = new THREE_PerspectiveCamera(fov, aspect, near, far)
    camera.position.set(x, y, z)
    return camera
  }

  static OrthographicCamera(scene: Scene, config: OrthographicCamera = {}): THREE.OrthographicCamera {
    const { width, height } = scene.cameras.main
    const {
      left = width / -100,
      right = width / 100,
      top = height / 100,
      bottom = height / -100,
      near = 1,
      far = 1000,
      x = 0,
      y = 0,
      z = 0
    } = config
    const camera = new THREE_OrthographicCamera(left, right, top, bottom, near, far)
    camera.position.set(x, y, z)
    return camera
  }
}
