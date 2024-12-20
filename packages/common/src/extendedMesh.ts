/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2021 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|LGPL-3.0}
 */

import { BufferGeometry, Material, Mesh, Vector3 } from 'three'
import type PhysicsBody from './physicsBody.js'

export class ExtendedMesh extends Mesh {
  public readonly isExtendedMesh = true
  public readonly isGroup = false

  private vector3 = new Vector3()

  public shape!: string
  public name: string
  public body!: PhysicsBody
  public hasBody: boolean = false

  // convex object breaking
  public fragmentDepth = 0
  public breakable = false
  public fractureImpulse = 1

  constructor(geometry?: BufferGeometry | undefined, material?: Material | Material[] | undefined) {
    super(geometry, material)
    this.name = `object-${this.id}`
  }

  /** Returns all values relative to the world. */
  get world() {
    return {
      theta: this.worldTheta,
      phi: this.worldPhi
    }
  }

  /** Get the theta relative to the world. */
  private get worldTheta() {
    this.getWorldDirection(this.vector3)
    return Math.atan2(this.vector3.x, this.vector3.z)
  }

  /** Get the phi relative to the world. */
  private get worldPhi() {
    this.getWorldDirection(this.vector3)
    return Math.acos(this.vector3.y)
  }
}
