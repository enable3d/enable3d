/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { Mesh, Vector3, BufferGeometry, Material } from '@enable3d/three-wrapper/dist/index'
import PhysicsBody from './physicsBody'

export interface ExtendedMesh extends Mesh {}

export class ExtendedMesh extends Mesh {
  private vector3 = new Vector3()
  public readonly isGroup = false

  public shape: string
  public name: string
  public body: PhysicsBody
  public hasBody: boolean = false
  public fragmentDepth: number
  public breakable: boolean
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
