/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2019 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

// copied from https://phaser.io/examples/v3/view/game-config/custom-webgl-canvas
// copied from https://github.com/mrdoob/three.js/blob/dev/src/renderers/WebGLRenderer.js

import { WEBGL } from 'phaser'

/**
 * The WebGL context created by Phaser does not meed the requirements of three.js.
 * So we create a custom canvas and merge the default contextAttributes from three.js into Phaser’s default contextAttributes.
 */
const customCanvas = (): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } => {
  // create canvas
  // @ts-ignore
  var myCustomCanvas: HTMLCanvasElement = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas')
  myCustomCanvas.id = 'myCustomCanvas'

  document.body.appendChild(myCustomCanvas)

  const parameters: any = { antialias: true }

  // https://github.com/mrdoob/three.js/blob/9549909d9c631aaa20d81c2fec863a470fa2e3f0/src/renderers/WebGLRenderer.js#L58
  const _alpha = parameters.alpha !== undefined ? parameters.alpha : false
  const _depth = parameters.depth !== undefined ? parameters.depth : true
  const _stencil = parameters.stencil !== undefined ? parameters.stencil : true
  const _antialias = parameters.antialias !== undefined ? parameters.antialias : false
  const _premultipliedAlpha = parameters.premultipliedAlpha !== undefined ? parameters.premultipliedAlpha : true
  const _preserveDrawingBuffer =
    parameters.preserveDrawingBuffer !== undefined ? parameters.preserveDrawingBuffer : false
  const _powerPreference = parameters.powerPreference !== undefined ? parameters.powerPreference : 'default'
  const _failIfMajorPerformanceCaveat =
    parameters.failIfMajorPerformanceCaveat !== undefined ? parameters.failIfMajorPerformanceCaveat : false

  // threejs's context attributes
  // https://github.com/mrdoob/three.js/blob/9549909d9c631aaa20d81c2fec863a470fa2e3f0/src/renderers/WebGLRenderer.js#L192
  var contextAttributes = {
    alpha: _alpha,
    depth: _depth,
    stencil: _stencil,
    antialias: _antialias,
    premultipliedAlpha: _premultipliedAlpha,
    preserveDrawingBuffer: _preserveDrawingBuffer,
    powerPreference: _powerPreference,
    failIfMajorPerformanceCaveat: _failIfMajorPerformanceCaveat,
    xrCompatible: true
  }

  //  default context config for phaser
  var contextCreationConfig = {
    alpha: false,
    depth: false,
    antialias: true,
    premultipliedAlpha: true,
    stencil: true,
    preserveDrawingBuffer: false,
    failIfMajorPerformanceCaveat: false,
    powerPreference: 'default',
    // merge bots context attributes
    ...contextAttributes
  }

  // create context
  // @ts-ignore
  var myCustomContext: CanvasRenderingContext2D = myCustomCanvas.getContext('webgl', contextCreationConfig)

  return {
    canvas: myCustomCanvas,
    context: myCustomContext
  }
}

export default customCanvas()
