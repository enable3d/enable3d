/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|LGPL-3.0}
 */

import { OrthographicCameraConfig, PerspectiveCameraConfig } from '@enable3d/common/dist/types.js'
import { OrthographicCamera, PerspectiveCamera } from 'three'

export default class Cameras {
  public perspectiveCamera(config: PerspectiveCameraConfig = {}): PerspectiveCamera {
    return Cameras.Perspective(config)
  }

  public orthographicCamera(config: OrthographicCameraConfig = {}): OrthographicCamera {
    return Cameras.Orthographic(config)
  }

  static Perspective(config: PerspectiveCameraConfig = {}): PerspectiveCamera {
    // for phaser
    // aspect = scene.scale.gameSize.aspectRatio
    const {
      fov = 50,
      aspect = window.innerWidth / window.innerHeight,
      near = 0.1,
      far = 2000,
      x = 0,
      y = 5,
      z = 25
    } = config

    const camera = new PerspectiveCamera(fov, aspect, near, far)
    camera.position.set(x, y, z)

    return camera
  }

  static Orthographic(config: OrthographicCameraConfig = {}): OrthographicCamera {
    // for phaser
    // const { width, height } = scene.cameras.main
    const width = window.innerWidth
    const height = window.innerHeight

    const {
      left = width / -2,
      right = width / 2,
      top = height / 2,
      bottom = height / -2,
      near = 1,
      far = 1000,
      x = 0,
      y = 0,
      z = 10
    } = config

    const camera = new OrthographicCamera(left, right, top, bottom, near, far)
    camera.position.set(x, y, z)

    return camera
  }
}
