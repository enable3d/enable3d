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

import { Object3D, OrthographicCamera, PerspectiveCamera, MathUtils as THREE_Math, Vector2, Vector3 } from 'three'

export interface ThirdPersonControlsConfig {
  offset?: Vector3
  sensitivity?: Vector2
  radius?: number
  targetRadius?: number
  interpolationFactor?: number
  pointerLock?: boolean
  autoUpdate?: boolean
  /** Theta in deg */
  theta?: number
  /** Phi in deg */
  phi?: number
  /** Max Phi in deg */
  maxPhi?: number
  /** Min Phi in deg */
  minPhi?: number
}

class ThirdPersonControls {
  /**
   * Sensitivity of the movement
   * @default new THREE.Vector2(0.25, 0.25)
   */
  public sensitivity: Vector2
  public radius: number
  public targetRadius: number
  public offset: Vector3
  public interpolationFactor: number
  /** Theta in deg */
  public theta: number
  /** Phi in deg */
  public phi: number
  /** Max Phi in deg */
  public maxPhi: number
  /** Min Phi in deg */
  public minPhi: number

  constructor(
    private camera: PerspectiveCamera | OrthographicCamera,
    private target: Object3D,
    private config: ThirdPersonControlsConfig
  ) {
    const {
      offset = new Vector3(0, 0, 0),
      sensitivity = new Vector2(0.25, 0.25),
      radius = 8,
      targetRadius = 10,
      interpolationFactor = 0.05,
      theta = 0,
      phi = 0,
      /** Max Phi in deg */
      maxPhi = 85,
      /** Min Phi in deg */
      minPhi = -85
    } = config

    this.offset = offset
    this.sensitivity = sensitivity
    this.radius = radius
    this.targetRadius = targetRadius
    this.interpolationFactor = interpolationFactor
    this.theta = theta
    this.phi = phi
    this.maxPhi = maxPhi
    this.minPhi = minPhi
  }

  update(deltaX: number, deltaY: number) {
    const target = this.target.position.clone().add(this.offset)

    this.theta -= deltaX * (this.sensitivity.x / 2)
    this.theta %= 360
    this.phi += deltaY * (this.sensitivity.y / 2)
    this.phi = Math.min(this.maxPhi, Math.max(this.minPhi, this.phi))

    this.radius = THREE_Math.lerp(this.radius, this.targetRadius, this.interpolationFactor)

    this.camera.position.x =
      target.x + this.radius * Math.sin((this.theta * Math.PI) / 180) * Math.cos((this.phi * Math.PI) / 180)
    this.camera.position.y = target.y + this.radius * Math.sin((this.phi * Math.PI) / 180)

    this.camera.position.z =
      target.z + this.radius * Math.cos((this.theta * Math.PI) / 180) * Math.cos((this.phi * Math.PI) / 180)

    this.camera.updateMatrix()
    this.camera.lookAt(target)
  }
}

export { ThirdPersonControls }
