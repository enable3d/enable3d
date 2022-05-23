/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2021 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import type { WebGLRenderer } from 'three'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import { Scene, OrthographicCamera, Vector2 } from 'three'
import Cameras from '../plugins/cameras'
import { setOrbitControls, setParent } from './_misc'
import { updateEvents, setSize } from './_misc'
export { updateEvents, getParent, destroy, setSize } from './_misc'

export interface FlatInitConfig {
  width?: number
  height?: number
  /**
   * Size of the renderer.
   * Usually: renderer.getSize(new Vector2())
   */
  size?: { x: number; y: number }
}

export interface FlatArea {
  camera: OrthographicCamera
  scene: Scene
}

/** Init the 2D element support. */
export const init = (renderer: WebGLRenderer, config: FlatInitConfig = {}): FlatArea => {
  // To allow render overlay on top of the 3d camera
  renderer.autoClear = false

  const { width = window.innerWidth, height = window.innerHeight, size = renderer.getSize(new Vector2()) } = config

  setSize(size.x, size.y)

  return {
    // {x: 0, y: 0} is bottomLeft
    camera: Cameras.Orthographic({ left: 0, right: width, bottom: 0, top: height }),
    scene: new Scene()
  }
}

/** Use this if you need events on the 2D elements. */
export const initEvents = ({ canvas, orbitControls }: { canvas: HTMLCanvasElement; orbitControls?: OrbitControls }) => {
  setOrbitControls(orbitControls)
  setParent(canvas)
}

export const preRender = (renderer: WebGLRenderer) => {
  renderer.clear()
}

export const postRender = (renderer: WebGLRenderer, flatArea: FlatArea) => {
  if (flatArea && flatArea.scene && flatArea.camera) {
    renderer.clearDepth()
    renderer.render(flatArea.scene, flatArea.camera)

    updateEvents(flatArea.camera)
  }
}
