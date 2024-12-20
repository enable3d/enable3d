/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2021 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|LGPL-3.0}
 */

import { LinearFilter, Texture } from 'three'
import { SimpleSprite } from './simpleSprite.js'
import { canvas, createNewTexture } from './_misc.js'

type DrawCanvas = (ctx: CanvasRenderingContext2D) => void

export class DrawTexture extends Texture {
  width: number
  height: number
  drawCanvas: DrawCanvas

  clone(): this {
    return new DrawTexture(this.width, this.height, this.drawCanvas).copy(this) as this
  }

  copy(source: this) {
    super.copy(source)
    return this
  }

  constructor(width: number, height: number, drawCanvas: DrawCanvas) {
    // get ctx and clear
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // set width and height
    canvas.height = height
    canvas.width = width

    // let the user draw the ctx
    drawCanvas(ctx)

    // generate image and texture
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height) as any
    super(imageData)
    this.minFilter = LinearFilter
    this.generateMipmaps = false

    this.width = width
    this.height = height
    this.drawCanvas = drawCanvas

    this.needsUpdate = true
  }
}

export class DrawSprite extends SimpleSprite {
  private _drawCanvas: DrawCanvas

  clone(): this {
    return new DrawSprite(this.textureWidth, this.textureHeight, this._drawCanvas).copy(this) as this
  }

  copy(source: this): this {
    super.copy(source)
    return this
  }

  constructor(width: number, height: number, drawCanvas: DrawCanvas) {
    // get ctx and clear
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // set width and height
    canvas.height = height
    canvas.width = width

    // let the user draw the ctx
    drawCanvas(ctx)

    // generate image and texture
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const texture = createNewTexture(image)
    super(texture)

    this._drawCanvas = drawCanvas
  }
}
