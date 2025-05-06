/**
 * @description  This code has originally been copied from Sketchbook (https://github.com/swift502/Sketchbook/blob/master/src/ts/core/CameraOperator.ts)
 *
 * @author       swift502 <blaha.j502@gmail.com> (http://jblaha.art/)
 * @copyright    Copyright (c) 2020 swift502; Project Url: https://github.com/swift502/Sketchbook
 * @license      {@link https://github.com/swift502/Sketchbook/blob/master/LICENSE MIT}
 *
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2025 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE LGPL-3.0}
 */

import { Object3D, OrthographicCamera, PerspectiveCamera, Vector2, Vector3 } from 'three'

export interface FirstPersonControlsConfig {
  offset?: Vector3
  /**
   * Sensitivity of the movement
   * @default new THREE.Vector2(0.25, 0.25)
   */
  sensitivity?: Vector2
  radius?: number
  targetRadius?: number
  interpolationFactor?: number
  /** Theta in deg */
  theta?: number
  /** Phi in deg */
  phi?: number
}

class FirstPersonControls {
  public sensitivity: Vector2
  public radius: number
  public targetRadius: number
  public offset: Vector3
  public interpolationFactor: number
  protected theta: number
  protected phi: number

  constructor(
    protected camera: PerspectiveCamera | OrthographicCamera,
    protected target: Object3D,
    protected config: FirstPersonControlsConfig
  ) {
    const {
      offset = new Vector3(0, 0, 0),
      sensitivity = new Vector2(0.25, 0.25),
      radius = 8,
      targetRadius = 10,
      interpolationFactor = 0.05,
      theta = 0,
      phi = 0
    } = config

    this.offset = offset
    this.sensitivity = sensitivity
    this.radius = radius
    this.targetRadius = targetRadius
    this.interpolationFactor = interpolationFactor

    this.theta = theta
    this.phi = phi
  }

  update(deltaX: number, deltaY: number) {
    const center = this.target.position.clone().add(this.offset)
    this.camera.position.copy(center)

    this.theta -= deltaX * (this.sensitivity.x / 2)
    this.theta %= 360
    this.phi += deltaY * (-this.sensitivity.y / 2)
    this.phi = Math.min(85, Math.max(-85, this.phi))

    const lookAt = new Vector3()
    lookAt.x = center.x + this.radius * Math.sin((this.theta * Math.PI) / 180) * Math.cos((this.phi * Math.PI) / 180)
    lookAt.y = center.y + this.radius * Math.sin((this.phi * Math.PI) / 180)
    lookAt.z = center.z + this.radius * Math.cos((this.theta * Math.PI) / 180) * Math.cos((this.phi * Math.PI) / 180)

    this.camera.updateMatrix()
    this.camera.lookAt(lookAt)
  }
}

export { FirstPersonControls }
