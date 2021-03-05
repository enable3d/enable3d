/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2021 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { setParent, setOrbitControls } from './_misc'
export { updateEvents, getParent, destroy, setSize } from './_misc'

export const initEvents = ({ canvas, orbitControls }: { canvas: HTMLCanvasElement; orbitControls?: OrbitControls }) => {
  setOrbitControls(orbitControls)
  setParent(canvas)
}
