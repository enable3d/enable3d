/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import {
  AnimationClip,
  AnimationMixer,
  Mesh,
  Line,
  Points,
  Object3D,
  Vector3,
  LoopOnce
} from '@enable3d/three-wrapper/dist/index'
import PhysicsBody from './physicsBody'
import { AnimationAction } from '@enable3d/three-wrapper/dist/index'

export interface ExtendedObject3D extends Line, Mesh, Points {
  isLine: any
  isPoints: any
  isMesh: any
  type: any
}

/**
 * Extends the Object3D class from THREE.js and implements properties from Line, Mesh and Points.
 */
export class ExtendedObject3D extends Object3D {
  private vector3 = new Vector3()
  public readonly isGroup = false

  public shape: string
  public name: string
  public body: PhysicsBody
  public hasBody: boolean = false

  // convex object breaking
  public fragmentDepth = 0
  public breakable = false
  public fractureImpulse = 1

  private anims: any = {} // deprecated

  private _currentAnimation: string = ''
  private _animationActions: Map<string, AnimationAction> = new Map()
  private _animationMixer: AnimationMixer

  constructor() {
    super()
    this.name = `object-${this.id}`
  }

  /** setAction(name) is deprecated. Use animation.play(name) instead! */
  public setAction(name: string) {
    console.warn('[enable3d] setAction(name) is deprecated. Use animation.play(name) instead!')
    this.animationPlay(name)
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

  public get animation() {
    return {
      current: this._currentAnimation,
      add: (key: string, animation: AnimationClip) => this.animationAdd(key, animation),
      play: (name: string, transitionDuration = 500, loop: boolean = true) =>
        this.animationPlay(name, transitionDuration, loop),
      mixer: this.animationMixer
    }
  }

  public set animationMixer(animationMixer: AnimationMixer) {
    this._animationMixer = animationMixer
  }

  public get animationMixer() {
    if (!this._animationMixer) this._animationMixer = new AnimationMixer(this)
    return this._animationMixer
  }

  private animationAdd(key: string, animation: AnimationClip) {
    this._animationActions.set(key, this.animationMixer.clipAction(animation))
  }

  private animationPlay(name: string, transitionDuration = 500, loop: boolean = true) {
    const next = this._animationActions.get(name)
    const current = this._animationActions.get(this._currentAnimation)

    if (next) {
      next.reset()

      if (current) {
        next.crossFadeFrom(current, transitionDuration / 1000, true)
        next.clampWhenFinished = true
      }

      if (!loop) next.setLoop(LoopOnce, 0)
      next.play()
    }

    this._currentAnimation = name
  }
}

export default ExtendedObject3D
