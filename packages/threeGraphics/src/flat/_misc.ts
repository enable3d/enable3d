/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2021 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|LGPL-3.0}
 */

import { Camera, LinearFilter, Raycaster, Texture, Vector2 } from 'three'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Tap } from '@yandeu/tap'
import { SimpleSprite } from './simpleSprite.js'

// https://stackoverflow.com/a/7838871
export const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  if (w < 2 * r) r = w / 2
  if (h < 2 * r) r = h / 2

  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export const fontHeightCache: Map<string, number> = new Map()

export const calcHeight = (text: string, fontSize: number, fontFamily: string, lineHeight: number = 1) => {
  const key = fontSize + fontFamily
  let height = fontHeightCache.get(key)

  if (!height) {
    // https://stackoverflow.com/a/10500938
    const span = document.createElement('p')

    span.style.fontFamily = fontFamily
    span.style.fontSize = `${fontSize}px`
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

export const calcWidth = (ctx: CanvasRenderingContext2D, lines: string[]) => {
  // return the longest line
  return Math.max(...lines.map(line => Math.ceil(ctx.measureText(line).width)))
}

export const createNewTexture = (image: any) => {
  const texture = new Texture(image)
  texture.minFilter = LinearFilter
  texture.generateMipmaps = false

  // texture.magFilter = NearestFilter
  // texture.minFilter = NearestFilter

  // texture.magFilter = NearestFilter
  // texture.minFilter = LinearMipMapLinearFilter

  texture.needsUpdate = true
  return texture
}

// create the canvas for the texture
export const canvas = document.createElement('canvas')

let parent: HTMLCanvasElement
let orbitCtl: OrbitControls
let tap: Tap
let down = false

const objects: any[] = []
const raycaster = new Raycaster()
const mouse = new Vector2()
const pos = new Vector2()
const size = new Vector2()
const messages: string[] = []

const warn = (msg: string) => {
  if (messages.includes(msg)) return
  console.warn(msg)
  messages.push(msg)
}

export const setSize = (width: number, height: number) => {
  size.x = width
  size.y = height
}

export const setParent = (canvas: HTMLCanvasElement) => {
  parent = canvas
}

export const getParent = () => parent

export const setOrbitControls = (orbitControls?: OrbitControls) => {
  if (orbitControls) orbitCtl = orbitControls
}

const addEventListeners = () => {
  // get the canvas element for the input events
  const canvas = getParent()
  if (!canvas) {
    warn('Please call "FLAT.initEvents()" first.')
    return
  }

  tap = new Tap(canvas)
}

export const destroy = () => {
  clearObjects()
  if (tap) tap.destroy()
}

export const addObject = (object: any) => {
  if (objects.length === 0) addEventListeners()
  objects.push(object)
}

export const clearObjects = () => {
  while (objects.length > 0) {
    objects.pop()
  }
}

// TODO(yandeu) Don't call this in a update loop! Call it on an input event!!! Or not? I don't know :/
export const updateEvents = async (camera: Camera) => {
  // console.log(tap.currentPosition)

  if (!tap) return

  const {
    currentPosition: { x, y },
    isDown
  } = tap

  const hasMouseMoved = mouse.x !== x || mouse.y !== y
  const hasClicked = down !== isDown
  if (!hasMouseMoved && !hasClicked) return

  down = isDown

  mouse.x = x
  mouse.y = y

  if (size.x === 0 || typeof size.x === 'undefined') {
    warn('[FLAT] Please call FLAT.setSize() first!')
    return
  }

  // calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components
  pos.x = (x / size.x) * 2 - 1
  pos.y = -(y / size.y) * 2 + 1

  // update the picking ray with the camera and mouse position
  raycaster.setFromCamera(pos, camera)

  let _objects = [...objects]

  // calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObjects(_objects)
  // console.log('i', intersects)

  if (intersects.length === 0) document.body.style.cursor = 'default'
  else document.body.style.cursor = 'pointer'

  if (orbitCtl && orbitCtl.enabled && intersects.length >= 0) orbitCtl.enabled = false
  if (orbitCtl && !orbitCtl.enabled && intersects.length === 0) orbitCtl.enabled = true

  for (let i = 0; i < intersects.length; i++) {
    const object = intersects[i].object as SimpleSprite

    let isTransparent = false

    if (object.pixelPerfect) {
      // https://github.com/mrdoob/three.js/issues/758
      const getImageData = (image: ImageBitmap) => {
        // const canvas = document.createElement('canvas')
        canvas.width = image.width
        canvas.height = image.height

        const context = canvas.getContext('2d') as CanvasRenderingContext2D

        context.drawImage(image, 0, 0)
        return context.getImageData(0, 0, image.width, image.height)
      }

      const getPixel = (imagedata: ImageData, x: number, y: number) => {
        const position = (x + imagedata.width * y) * 4
        const data = imagedata.data
        return { r: data[position], g: data[position + 1], b: data[position + 2], a: data[position + 3] }
      }

      const uv = intersects[0].uv
      const { x, y } = object.texture.transformUv(uv as Vector2)
      const bitmap = await createImageBitmap(object.texture.image)
      const imageData = getImageData(bitmap) as ImageData
      const { r, g, b, a } = getPixel(imageData, Math.round(x * imageData.width), Math.round(y * imageData.height))
      isTransparent = r + g + b + a === 0
    }

    // get the colors of the pixel
    // var gl = renderer.getContext()
    // var pixels = new Uint8Array(1 * 1 * 4)
    // gl.readPixels(client.x, window.innerHeight - client.y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
    // console.log(pixels) // Uint8Array

    // we skip to the next object in intersects[] if this pixel is transparent
    if (object.pixelPerfect && isTransparent) continue

    // set event
    object.event = tap.isDown ? 'down' : 'over'

    // Removing Items in Arrays
    const removeIndex = _objects.findIndex(o => o.uuid === object.uuid)
    _objects = [..._objects.slice(0, removeIndex), ..._objects.slice(removeIndex + 1)]

    // we do not want to send events to objects that lay lower
    break
  }

  // send out event remaining objects
  _objects.forEach(o => {
    o.event = 'out'
  })

  return intersects
}
