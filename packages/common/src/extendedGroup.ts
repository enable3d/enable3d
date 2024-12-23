/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2021 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|LGPL-3.0}
 */

import { Group } from 'three'
import type PhysicsBody from './physicsBody.js'

export class ExtendedGroup extends Group {
  public ptr: any | undefined
  public readonly isExtendedGroup = true
  public readonly isMesh = false

  public shape!: string
  public name: string
  public body!: PhysicsBody
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
