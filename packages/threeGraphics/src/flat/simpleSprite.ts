/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2021 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { Texture, Sprite, SpriteMaterial } from 'three'
import { addObject } from './_misc'

export class SimpleSprite extends Sprite {
  protected _event: string = 'out'
  protected _pixelPerfect: boolean = false

  private _isInteractive = false
  private _depth = 0

  public body: Matter.Body
  public setBodyPosition: (x: number, y: number) => void // will be added by physics

  protected _bodyOffset = { x: 0, y: 0 }

  public textureWidth: number
  public textureHeight: number

  protected _internalScale = { x: 1, y: 1 }
  protected _pixelRatio = 1

  public onInputOver = () => {}
  protected _onInputOver() {}

  public onInputOut = () => {}
  protected _onInputOut() {}

  public onInputDown = () => {}
  protected _onInputDown() {}

  set event(event: string) {
    if (this._event === event) return
    this._event = event

    if (event === 'over') {
      this._onInputOver()
      this.onInputOver()
    } else if (event === 'out') {
      this._onInputOut()
      this.onInputOut()
    } else if (event === 'down') {
      this._onInputDown()
      this.onInputDown()
    }
  }

  setPixelRatio(pixelRatio: number) {
    this._pixelRatio = pixelRatio
    this.setScale(this._internalScale.x, this._internalScale.y)
  }

  setInteractive({ pixelPerfect = false }: { pixelPerfect?: boolean } = {}): void {
    if (this._isInteractive) return
    this._isInteractive = true

    this._pixelPerfect = pixelPerfect

    addObject(this)
  }

  get pixelPerfect() {
    return this._pixelPerfect
  }

  constructor(texture: Texture, clone: boolean = true) {
    super(
      new SpriteMaterial({
        map: clone ? texture.clone() : texture,
        color: 0xffffff
      })
    )

    this._setTexture()

    this.setScale(this._internalScale.x, this._internalScale.y)
    this.setDepth(this._calcZ())
  }

  private _calcZ() {
    return this._depth / 100 - this.id * 1e-8
  }

  getTexture() {
    return this.texture
  }

  setTexture(texture: Texture) {
    this._setTexture(texture)
  }

  get texture() {
    return this.material.map as Texture
  }

  private _setTexture(texture?: Texture) {
    if (!this.material.map) {
      console.warn('Something went wrong!')
      return
    }

    if (texture) this.material.map = texture

    const { width, height } = this.material.map.image
    this.textureWidth = width
    this.textureHeight = height

    this.material.map.needsUpdate = true
  }

  getBodyOffset() {
    // remember: pixelRatio is only for the sprite, not the body
    return {
      x: this._bodyOffset.x * this.getScale().x /* / this.getPixelRatio()*/,
      y: this._bodyOffset.y * this.getScale().y /* / this.getPixelRatio()*/
    }
  }

  setPosition(x: number, y: number) {
    this.position.set(x, y, this._calcZ())
  }

  setDepth(z: number) {
    this._depth = z
    this.position.setZ(this._calcZ())
  }

  setRotation(rotation: number) {
    this.material.rotation = rotation
  }

  getRotation() {
    return this.material.rotation
  }

  getPixelRatio() {
    return this._pixelRatio
  }

  getScale() {
    return { x: this._internalScale.x, y: this._internalScale.y }
  }

  setScale(x: number, y?: number) {
    this._internalScale.x = x

    if (y) this._internalScale.y = y
    else this._internalScale.y = x

    const xx = x
    const yy = y ? y : x
    this.scale.set((xx * this.textureWidth) / this._pixelRatio, (yy * this.textureHeight) / this._pixelRatio, 1)
  }
}
