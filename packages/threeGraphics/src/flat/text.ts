/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2021 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

// https://github.com/gamestdio/three-text2d/blob/master/src/CanvasText.ts

import { LinearFilter, Texture } from 'three'
import { SimpleSprite, canvas } from './index'
import { createNewTexture } from './_misc'

const fontHeightCache: Map<string, number> = new Map()

const calcHeight = (text: string, fontSize: number, fontFamily: string, lineHeight: number = 1) => {
  const key = fontSize + fontFamily
  let height = fontHeightCache.get(key)

  if (!height) {
    // https://stackoverflow.com/a/10500938
    const span = document.createElement('p')

    span.style.fontFamily = fontFamily
    span.style.fontSize = fontSize + 'px'
    span.style.whiteSpace = 'nowrap'
    span.style.lineHeight = lineHeight.toString()
    span.textContent = text

    document.body.appendChild(span)
    height = Math.ceil(span.offsetHeight)
    document.body.removeChild(span)

    // add to cache
    fontHeightCache.set(key, height)
  }

  return height
}

const calcWidth = (ctx: CanvasRenderingContext2D, lines: string[]) => {
  // return the longest line
  return Math.max(...lines.map(line => Math.ceil(ctx.measureText(line).width)))
}

const createTextImage = (text: string, color: string) => {
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

  // clean up
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const fontSize = 72
  const fontFamily = 'Arial'
  const lineHeight = 1
  const lines = text.split('\n')

  ctx.font = `bold ${fontSize}px ${fontFamily}`

  let line_Height = calcHeight(text, fontSize, fontFamily, lineHeight)

  let height = line_Height * lines.length
  let width = calcWidth(ctx, lines)

  // adjust to PowerOfTwo (WebGL1 only)
  // width = Math.max(2, MathUtils.ceilPowerOfTwo(width))
  // height = Math.max(2, MathUtils.ceilPowerOfTwo(height))

  canvas.height = height
  canvas.width = width

  // background
  // ctx.fillStyle = '#c4c4c4'
  // ctx.fillRect(0, 0, canvas.width, canvas.height)

  // text
  ctx.font = `bold ${fontSize}px ${fontFamily}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = color

  for (var i = 0; i < lines.length; i++) {
    const top = i * line_Height + line_Height / 2
    const left = 0
    ctx.fillText(lines[i], left, top)
  }

  // https://github.com/makc/Edelweiss/blob/c3e63135f2f57f1a422c30abbeca35e579b84f02/docs/js/AssetManager.js#L245
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height) as any

  return { imageData, width, height }
}

export class TextTexture extends Texture {
  private _text: string
  private _image: any

  width: number
  height: number

  getText() {
    return this._text
  }

  clone(): TextTexture {
    // @ts-ignore
    return new this.constructor(this._text).copy(this)
  }

  constructor(text: string, color: string = '#00ff00') {
    const { imageData, width, height } = createTextImage(text, color)
    super(imageData)

    this.width = width
    this.height = height

    this._image = imageData
    this._text = text

    this.minFilter = LinearFilter
    this.generateMipmaps = false

    this.needsUpdate = true
  }
}

export class TextSprite extends SimpleSprite {
  private _text: string

  constructor(texture: TextTexture) {
    super(texture, false)
    this._text = texture.getText()
  }

  setText(text: string, color: string = '#00ff00') {
    this._text = text

    // dispose
    this.texture.dispose()

    // create
    this.texture = this.material.map = createNewTexture(createTextImage(text, color).imageData)

    // update size
    this.height = this.texture.image.height
    this.width = this.texture.image.width

    // update
    this.texture.needsUpdate = true
    this.material.needsUpdate = true

    const { x, y } = this._internalScale
    this.setScale(x, y)
  }

  getText() {
    return this._text
  }
}
