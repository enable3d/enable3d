/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2021 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { LinearFilter, Texture } from 'three'
import { SimpleSprite } from './simpleSprite'
import { calcHeight, calcWidth, canvas, clearObjects, createNewTexture, roundRect } from './_misc'

export interface TextStyles {
  align?: 'center' | 'left' | 'right'
  background?: string | CanvasGradient | CanvasPattern
  baseline?: CanvasTextBaseline
  borderColor?: string
  borderRadius?: number
  borderWidth?: number
  fillStyle?: string | CanvasGradient | CanvasPattern
  fontFamily?: string
  fontSize?: number
  fontWeight?: string
  lineHeight?: number
  lineWidth?: number
  offset?: { x?: number; y?: number }
  padding?: number | { x?: number; y?: number }
  strokeStyle?: string | CanvasGradient | CanvasPattern
}

export class TextTexture extends Texture {
  private _text: string
  private _styles: TextStyles
  private _image: any

  width: number
  height: number

  getText() {
    return this._text
  }

  getStyles() {
    return this._styles
  }

  // @ts-ignore
  clone(): TextTexture {
    // @ts-ignore
    return new this.constructor(this._text, this._styles).copy(this)
  }

  constructor(text: string, styles: TextStyles = {}) {
    const { imageData, width, height } = createTextImage(text, styles)
    super(imageData)

    this.width = width
    this.height = height

    this._text = text
    this._styles = styles
    this._image = imageData

    this.minFilter = LinearFilter
    this.generateMipmaps = false

    this.needsUpdate = true
  }
}

export class TextSprite extends SimpleSprite {
  private _text: string
  private _styles: TextStyles

  constructor(texture: TextTexture) {
    super(texture, false)
    this._text = texture.getText()
    this._styles = texture.getStyles()
  }
  getText() {
    return this._text
  }

  getStyles() {
    return this._styles
  }

  setStyles(styles: TextStyles) {
    this._styles = styles

    this.texture.dispose()

    this.setTexture(createNewTexture(createTextImage(this._text, styles).imageData))
  }

  setText(text: string) {
    this._text = text

    this.texture.dispose()

    this.setTexture(createNewTexture(createTextImage(text, this._styles).imageData))

    this._update()
  }

  _update() {
    // update size
    this.textureHeight = this.texture.image.height
    this.textureWidth = this.texture.image.width

    // update
    this.texture.needsUpdate = true
    this.material.needsUpdate = true

    const { x, y } = this._internalScale
    this.setScale(x, y)
  }
}

const createTextImage = (text: string, styles: TextStyles) => {
  const {
    align = 'center',
    background = '',
    baseline = 'middle',
    borderColor = '',
    borderRadius = 0,
    borderWidth = 0,
    fillStyle = 'SlateBlue',
    fontFamily = 'Arial',
    fontSize = 48,
    fontWeight = '',
    lineHeight = 1,
    lineWidth = 4,
    padding = 0,
    strokeStyle = ''
  } = styles

  // get offset
  const { offset: { x: offsetX = 0, y: offsetY = 0 } = {} } = styles

  // get padding
  let paddingX
  let paddingY
  if (typeof padding !== 'number') {
    paddingX = padding.x || 0
    paddingY = padding.y || 0
  } else {
    paddingX = padding
    paddingY = padding
  }

  const font = `${fontWeight} ${fontSize}px ${fontFamily}`

  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

  // clean up
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const lines = text.split('\n')

  ctx.font = font

  const line_height = calcHeight(text, fontSize, fontFamily, lineHeight)
  const line_width = fillStyle ? lineWidth * 2 : lineWidth

  const height = line_height * lines.length + paddingY * 2 + borderWidth * 2
  const width = calcWidth(ctx, lines) + line_width + paddingX * 2 + borderWidth * 2

  // adjust to PowerOfTwo (WebGL1 only)
  // width = Math.max(2, MathUtils.ceilPowerOfTwo(width))
  // height = Math.max(2, MathUtils.ceilPowerOfTwo(height))

  canvas.height = height
  canvas.width = width

  // border
  if (borderColor) {
    ctx.strokeStyle = borderColor
    roundRect(
      ctx,
      borderWidth / 2,
      borderWidth / 2,
      canvas.width - borderWidth,
      canvas.height - borderWidth,
      borderRadius
    )
    ctx.lineWidth = borderWidth
    ctx.stroke()
  }

  // background
  if (background) {
    ctx.fillStyle = background
    roundRect(
      ctx,
      borderWidth,
      borderWidth,
      canvas.width - borderWidth * 2,
      canvas.height - borderWidth * 2,
      borderColor ? borderRadius / 2 : borderRadius
    )
    ctx.fill()

    // if (borderColor && borderWidth)
    //   ctx.fillRect(borderWidth, borderWidth, canvas.width - borderWidth * 2, canvas.height - borderWidth * 2)
    // else ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  // text
  ctx.font = font
  ctx.textAlign = align
  ctx.textBaseline = baseline

  if (strokeStyle && lineWidth) {
    ctx.strokeStyle = strokeStyle
    ctx.lineWidth = line_width
  }

  if (fillStyle) ctx.fillStyle = fillStyle

  for (var i = 0; i < lines.length; i++) {
    let top = i * line_height + line_height / 2
    let left = 0

    if (align === 'left') {
      left = line_width / 2
      left += paddingX
      left += borderWidth
    }
    if (align === 'center') {
      left = width / 2
    }
    if (align === 'right') {
      left = width - line_width / 2
      left -= paddingX
      left -= borderWidth
    }

    top += paddingY
    top += borderWidth

    top += offsetY
    left += offsetX

    if (strokeStyle && lineWidth) ctx.strokeText(lines[i], left, top)
    if (fillStyle) ctx.fillText(lines[i], left, top)
  }

  // https://github.com/makc/Edelweiss/blob/c3e63135f2f57f1a422c30abbeca35e579b84f02/docs/js/AssetManager.js#L245
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height) as any

  return { imageData, width, height }
}
