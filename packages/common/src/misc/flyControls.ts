/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2025 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE LGPL-3.0}
 */

import { Object3D, OrthographicCamera, PerspectiveCamera, Vector3 } from 'three'
import { FirstPersonControls, FirstPersonControlsConfig } from './firstPersonControls.js'

import { Keyboard } from '@yandeu/keyboard'
import { Tap } from '@yandeu/tap'

export interface FlyControlsConfig extends FirstPersonControlsConfig {
  speed?: number
}

/**
 * A simple FlyController I use to fly around the world while developing.
 */
export class FlyControls extends FirstPersonControls {
  keyboard = new Keyboard()
  tap!: Tap
  speed: number

  constructor(
    camera: PerspectiveCamera | OrthographicCamera,
    domElement: HTMLElement,
    config: FlyControlsConfig,
    position: Vector3 = new Vector3(0, 1, 0)
  ) {
    const target = new Object3D()
    target.position.copy(position)

    super(camera, target, config)

    this.tap = new Tap(domElement)
    this.speed = config.speed || 0.1

    this.tap.on.move(({ position, event, dragging }) => {
      const isDragging = dragging
      if (isDragging) {
        const x = this.tap.lastPosition.x - this.tap.currentPosition.x
        const y = this.tap.lastPosition.y - this.tap.currentPosition.y
        super.update(x, y)
      }
    })
  }

  dispose() {
    this.tap.destroy()
    this.keyboard.destroy()
  }

  destroy() {
    this.dispose()
  }

  moveObjectTowards(object: any, theta: number, phi: number, speed = 0.05, backward = false) {
    const radius = speed // Adjust radius for desired speed

    const sinPhiRadius = Math.sin(phi) * radius
    const x = sinPhiRadius * Math.sin(theta)
    const y = Math.cos(phi) * radius
    const z = sinPhiRadius * Math.cos(theta)

    const direction = new Vector3(x, y, z)
    direction.normalize() // Optional: make it a unit vector

    if (!backward) {
      object.position.add(direction.multiplyScalar(speed)) // Multiply for speed
    } else {
      object.position.sub(direction.multiplyScalar(speed)) // Multiply for speed
    }
  }

  update() {
    const direction = new Vector3()
    this.camera.getWorldDirection(direction)
    // Calculate theta (azimuthal angle)
    const theta = Math.atan2(direction.x, direction.z)
    // Calculate phi (polar angle)
    const phi = Math.atan2(Math.sqrt(direction.x * direction.x + direction.z * direction.z), direction.y)

    if (this.keyboard.key('KeyW').isDown) {
      this.moveObjectTowards(this.target, theta, phi, this.speed)
    }

    if (this.keyboard.key('KeyS').isDown) {
      this.moveObjectTowards(this.target, theta, phi, this.speed, true)
    }

    if (this.keyboard.key('KeyA').isDown) {
      this.target.position.x += Math.sin(theta + Math.PI / 2) * this.speed
      this.target.position.z += Math.cos(theta + Math.PI / 2) * this.speed
    }

    if (this.keyboard.key('KeyD').isDown) {
      this.target.position.x += Math.sin(theta - Math.PI / 2) * this.speed
      this.target.position.z += Math.cos(theta - Math.PI / 2) * this.speed
    }

    super.update(0, 0)
  }
}
