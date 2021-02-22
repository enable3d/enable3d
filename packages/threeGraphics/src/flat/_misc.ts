/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2021 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import {
  Camera,
  LinearFilter,
  NearestFilter,
  LinearMipMapLinearFilter,
  Raycaster,
  Texture,
  Vector2,
  WebGLRenderer,
  WebGLRenderTarget
} from 'three'
import { SimpleSprite } from './simpleSprite'

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

const objects: any[] = []
const raycaster = new Raycaster()
const mouse = new Vector2()
const mouse_last = new Vector2()
const client = new Vector2()

let mouse_click = false
let mouse_release = false

function init() {
  // TODO(yandeu) This needs improvement!

  const canvas = document.querySelector('canvas')
  if (!canvas) return

  if ('ontouchstart' in window) {
    canvas.removeEventListener('touchstart', onMouseClick, false)
    canvas.addEventListener('touchstart', onMouseClick, false)

    canvas.removeEventListener('touchend', onMouseRelease, false)
    canvas.addEventListener('touchend', onMouseRelease, false)

    canvas.removeEventListener('touchmove', onMouseMove, false)
    canvas.addEventListener('touchmove', onMouseMove, false)
  } else {
    canvas.removeEventListener('pointerdown', onMouseClick, false)
    canvas.addEventListener('pointerdown', onMouseClick, false)

    canvas.removeEventListener('pointerup', onMouseRelease, false)
    canvas.addEventListener('pointerup', onMouseRelease, false)

    canvas.removeEventListener('mousemove', onMouseMove, false)
    canvas.addEventListener('mousemove', onMouseMove, false)
  }
}

export function addObject(object: any) {
  if (objects.length === 0) init()
  objects.push(object)
}

export function clearObjects() {
  while (objects.length > 0) {
    objects.pop()
  }
}

function onMouseClick(event: any) {
  mouse_click = true

  // adjust mouse position
  onMouseMove(event)
}

function onMouseRelease(event: any) {
  mouse_release = true

  // adjust mouse position
  onMouseMove(event)
}

function onMouseMove(event: any) {
  let x
  let y

  if (event.touches && event.touches[0]) {
    x = event.touches[0].pageX
    y = event.touches[0].pageY
  } else if (event.clientX) {
    x = event.clientX
    y = event.clientY
  } else {
    return
  }

  client.x = x
  client.y = y

  // calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components
  mouse.x = (x / window.innerWidth) * 2 - 1
  mouse.y = -(y / window.innerHeight) * 2 + 1
}

export async function render(camera: Camera) {
  const hasMouseMoved = mouse.x !== mouse_last.x || mouse.y !== mouse_last.y
  if (!hasMouseMoved && !mouse_click && !mouse_release) return

  mouse_last.copy(mouse)

  if (mouse_release) {
    mouse_release = false
    mouse_click = false
  }

  // update the picking ray with the camera and mouse position
  raycaster.setFromCamera(mouse, camera)

  let _objects = [...objects]

  // calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObjects(_objects)

  for (let i = 0; i < intersects.length; i++) {
    const object = intersects[i].object as SimpleSprite

    let isTransparent = false

    if (object.pixelPerfect) {
      // https://github.com/mrdoob/three.js/issues/758
      function getImageData(image: ImageBitmap) {
        // const canvas = document.createElement('canvas')
        canvas.width = image.width
        canvas.height = image.height

        const context = canvas.getContext('2d') as CanvasRenderingContext2D

        context.drawImage(image, 0, 0)
        return context.getImageData(0, 0, image.width, image.height)
      }

      function getPixel(imagedata: ImageData, x: number, y: number) {
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
    object.event = mouse_click ? 'down' : 'over'

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
}
