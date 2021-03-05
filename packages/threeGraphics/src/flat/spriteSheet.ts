/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2021 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

// inspired by
// https://felixmariotto.github.io/from_indexed_texture
// https://github.com/felixmariotto/three-SpriteMixer/blob/master/examples/from_indexed_texture.html

import { RepeatWrapping, Texture } from 'three'
import { ActionSprite } from './actionSprite'

export interface SpriteSheetFrameOptions {
  width: number
  height: number
}

export class SpriteSheet extends ActionSprite {
  private _tilesHoriz: number
  private _tilesVert: number
  private _width: number
  private _height: number

  constructor(texture: Texture, frameOptions: SpriteSheetFrameOptions) {
    super(texture)

    const { width = this.textureWidth, height = this.textureHeight } = frameOptions

    this._tilesHoriz = this.textureWidth / width
    this._tilesVert = this.textureHeight / height

    if (this._tilesHoriz !== Math.round(this._tilesHoriz)) console.warn('The horizontal row does not seem to fit!')
    if (this._tilesVert !== Math.round(this._tilesVert)) console.warn('The vertical row does not seem to fit!')

    this._width = width
    this._height = height

    // stays always the same
    this._frame.width = width
    this._frame.height = height

    // this.texture.center.set(0.5, 0.5)
    // this.material.rotation = Math.PI // turn 180 deg

    this.sizeFrame(1 / this._tilesHoriz, 1 / this._tilesVert)
    this.scaleFrame()
  }

  setScale(x: number, y?: number) {
    super.setScale(x, y)
    this.scaleFrame()
  }

  protected scaleFrame() {
    this.scale.set(
      (this._width * this._internalScale.x) / this._pixelRatio,
      (this._height * this._internalScale.y) / this._pixelRatio,
      1
    )
  }

  // returns the row of the current tile.
  private getRow(index: number) {
    return Math.floor(index / this._tilesHoriz)
  }

  // returns the column of the current tile.
  private getColumn(index: number) {
    return index % this._tilesHoriz
  }

  protected sizeFrame(width: number, height: number) {
    this.texture.wrapS = this.texture.wrapT = RepeatWrapping
    this.texture.repeat.set(width, height)
    this.texture.needsUpdate = true
  }

  protected offsetTexture(x: number, y: number) {
    if (this._flipX) x += 1 / this._tilesHoriz

    this.texture.offset.setX(x)
    this.texture.offset.setY(y)
  }

  flipX(flip: boolean) {
    this._flipX = flip

    let x = 1 / this._tilesHoriz
    const y = 1 / this._tilesVert

    if (flip) x *= -1

    this.texture.repeat.set(x, y)

    this.setFrame(this._frame.index as number)
  }

  setFrame(index: number) {
    this._frame.index = index

    const x = this.getColumn(index) / this._tilesHoriz
    const y = (this._tilesVert - this.getRow(index) - 1) / this._tilesVert

    this.offsetTexture(x, y)
  }
}
