/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2021 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { ActionSprite } from './actionSprite'
import { RepeatWrapping, Texture } from 'three'

interface JSONArrayFrame {
  filename: string
  rotated: boolean
  trimmed: boolean
  sourceSize: {
    w: number
    h: number
  }
  spriteSourceSize: {
    x: number
    y: number
    w: number
    h: number
  }
  frame: {
    x: number
    y: number
    w: number
    h: number
  }
}

export type JSONArrayFrames = JSONArrayFrame[]

interface JSONHashFrames {
  [key: string]: {
    frame: { x: number; y: number; w: number; h: number }
    rotated: boolean
    trimmed: boolean
    spriteSourceSize: { x: number; y: number; w: number; h: number }
    sourceSize: { w: number; h: number }
  }
}

export interface JSONHash {
  frames: JSONHashFrames
}

export interface Atlas {
  texture: Texture
  json: JSONHash
}

export class TextureAtlas extends ActionSprite {
  private JSONHash: JSONHash
  private positionOffset = { x: 0, y: 0 }

  /**
   * @param texture Atlas Texture (image)
   * @param json Atlas .json file (string). Needs to be  "JSON hash".
   */
  constructor(atlas: Atlas, frame?: string) {
    super(atlas.texture)

    this.JSONHash = atlas.json

    if (frame) this.setFrame(frame)
  }

  setScale(x: number, y?: number) {
    this._internalScale.x = x

    if (y) this._internalScale.y = y
    else this._internalScale.y = x

    this.scaleFrame()
  }

  protected scaleFrame() {
    if (!this._frame?.name) return

    const {
      frame: { w, h }
    } = this.getFrame(this._frame.name as string)

    let scaleX = (w * this._internalScale.x) / this._pixelRatio
    let scaleY = (h * this._internalScale.y) / this._pixelRatio
    this.scale.set(scaleX, scaleY, 1)
  }

  protected sizeFrame(width: number, height: number) {
    this.texture.wrapS = this.texture.wrapT = RepeatWrapping
    this.texture.repeat.set(width, height)
    this.texture.needsUpdate = true
  }

  protected offsetTexture(x: number, y: number) {
    this.texture.offset.setX(x)
    this.texture.offset.setY(y)
  }

  public flipX(flip: boolean) {
    this._flipX = flip
    this.update()
  }

  public getFrame(frameName: string) {
    return this.JSONHash.frames[frameName]
  }

  public setFrame(frameName: string) {
    this.update(frameName)
  }

  private update(frameName?: string) {
    if (!frameName) frameName = this._frame.name as string
    if (!frameName) return

    const f = this.getFrame(frameName)
    if (!f) console.warn(`Frame ${frameName} not found!`)

    const { frame, rotated, trimmed, spriteSourceSize, sourceSize } = f

    // set current frame
    this._frame.name = frameName

    // reset rotation
    this.texture.rotation = 0

    // set values
    let x = frame.x / this.textureWidth
    let y = 1 - (frame.y + frame.h) / this.textureHeight
    let w = frame.w
    let h = frame.h

    this._frame.width = w
    this._frame.height = h

    // if the frame is rotated
    if (rotated) {
      // rotate texture
      this.texture.rotation = Math.PI / 2
      // adjust y
      y = 1 - frame.y / this.textureHeight
      // swap w and h
      ;[w, h] = [h, w]
      // check flipX
      if (this._flipX) this.texture.rotation *= -1
    }

    // if the frame is trimmed
    if (trimmed) {
      const newOffX = ((sourceSize.w - frame.w) / 2 - spriteSourceSize.x) / (1 / this._internalScale.x)
      const newOffY = ((sourceSize.h - frame.h) / 2 - spriteSourceSize.y) / (1 / this._internalScale.x)

      // x
      if (!this._flipX) this.position.x -= newOffX - this.positionOffset.x
      else this.position.x += newOffX - this.positionOffset.x

      //y
      this.position.y += newOffY - this.positionOffset.y

      this.positionOffset.x = newOffX
      this.positionOffset.y = newOffY
    }

    // set offset, size and scale
    let offsetX = x
    let offsetY = y

    let sizeX = w / this.textureWidth
    let sizeY = h / this.textureHeight

    // if the frame is flipped
    if (this._flipX) {
      sizeX *= -1

      if (!rotated) offsetX += frame.w / this.textureWidth
      else offsetY -= frame.w / this.textureHeight
    }

    this.offsetTexture(offsetX, offsetY)
    this.sizeFrame(sizeX, sizeY)
    this.scaleFrame()
  }
}
