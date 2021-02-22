/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { Group } from 'three'
import PhysicsBody from './physicsBody'

export interface ExtendedGroup extends Group {}

export class ExtendedGroup extends Group {
  public readonly isMesh = false

  public shape: string
  public name: string
  public body: PhysicsBody
  public hasBody: boolean = false

  // convex object breaking
  public fragmentDepth = 0
  public breakable = false
  public fractureImpulse = 1

  constructor() {
    super()
    this.name = `object-${this.id}`
  }
}
