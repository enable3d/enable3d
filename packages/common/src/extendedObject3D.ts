/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2021 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { AnimationClip, AnimationMixer, Line, LoopOnce, Mesh, Object3D, Points, Vector3 } from 'three'
import type PhysicsBody from './physicsBody'
import { AnimationAction } from 'three'
import { logger } from './logger'

export interface ExtendedObject3D extends Line, Mesh, Points {
  isLine: any
  isPoints: any
  isMesh: any
  type: any
}

export class ExtendedObject3D extends Object3D {
  public readonly isExtendedObject3D = true
  public readonly isGroup = false

  private vector3 = new Vector3()

  public shape: string
  public name: string
  public body: PhysicsBody
  public hasBody: boolean = false

  // convex object breaking
  public fragmentDepth = 0
  public breakable = false
  public fractureImpulse = 1
  public children: ExtendedObject3D[]
  public parent: ExtendedObject3D | null

  private _currentAnimation: string = ''
  private _animationActions: Map<string, AnimationAction> = new Map()
  private _animationMixer: AnimationMixer

  constructor() {
    super()
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

  public set animationMixer(animationMixer: AnimationMixer) {
    this._animationMixer = animationMixer
  }

  public get animationMixer() {
    if (!this._animationMixer) this._animationMixer = new AnimationMixer(this)
    return this._animationMixer
  }

  /** Control your animations. */
  public get anims() {
    return {
      /** Get the name of the current animation. */
      current: this._currentAnimation,
      /** Add animation name and the AnimationClip. */
      add: (name: string, animation: AnimationClip) => this._animsAdd(name, animation),
      /** Get AnimationAction by animation name. */
      get: (name: string) => this._animsGet(name),
      /**
       * Play an animation.
       * @param name Animation name.
       * @param transitionDuration Transition duration in ms.
       * @param loop Should the animation loop?
       */
      play: (name: string, transitionDuration = 500, loop: boolean = true) =>
        this._animsPlay(name, transitionDuration, loop),
      /** Get the AnimationMixer */
      mixer: this.animationMixer
    }
  }

  /** @deprecated Please use anims instead! */
  public get animation() {
    logger('Please use "anims" instead of "animation"')
    return this.anims
  }

  private _animsAdd(name: string, animation: AnimationClip) {
    this._animationActions.set(name, this.animationMixer.clipAction(animation))
  }

  private _animsGet(name: string) {
    const action = this._animationActions.get(name) as AnimationAction
    if (!action) logger(`Animation(${name}) not found!`)
    return action
  }

  private _animsPlay(name: string, transitionDuration = 500, loop: boolean = true) {
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

  /** @deprecated Use animation.play(name) instead! */
  public setAction(name: string) {
    logger(`setAction(${name}) is deprecated. Use animation.play(${name}) instead!`)
  }

  public traverse(callback: (object: ExtendedObject3D) => any): void {
    super.traverse(callback as any)
  }

  public traverseVisible(callback: (object: ExtendedObject3D) => any): void {
    super.traverseVisible(callback as any)
  }

  public traverseAncestors(callback: (object: ExtendedObject3D) => any): void {
    super.traverseAncestors(callback as any)
  }
}

export default ExtendedObject3D
