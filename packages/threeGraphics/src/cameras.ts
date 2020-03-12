/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { PerspectiveCamera, OrthographicCamera } from '@enable3d/common/src/types'
import {
  PerspectiveCamera as THREE_PerspectiveCamera,
  OrthographicCamera as THREE_OrthographicCamera
} from '@enable3d/three-wrapper/src/index'

export default class Cameras {
  static PerspectiveCamera(config: PerspectiveCamera = {}): THREE.PerspectiveCamera {
    // for phaser
    // aspect = scene.scale.gameSize.aspectRatio
    const {
      fov = 50,
      aspect = window.innerWidth / window.innerHeight,
      near = 0.1,
      far = 2000,
      x = 0,
      y = 0,
      z = 0
    } = config
    const camera = new THREE_PerspectiveCamera(fov, aspect, near, far)
    camera.position.set(x, y, z)
    return camera
  }

  static OrthographicCamera(config: OrthographicCamera = {}): THREE.OrthographicCamera {
    // for phaser
    // const { width, height } = scene.cameras.main
    const width = window.innerWidth
    const height = window.innerHeight
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
