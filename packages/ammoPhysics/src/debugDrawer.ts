/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @description  This is a modified version of the original code from Kevin Lee
 */

/**
 * @author       Kevin Lee (https://github.com/InfiniteLee)
 * @copyright    Copyright (c) 2019 Kevin Lee; Project Url: https://github.com/InfiniteLee/ammo-debug-drawer
 * @license      {@link https://github.com/InfiniteLee/ammo-debug-drawer/blob/master/LICENSE|MPL-2.0}
 */

import { BufferAttribute, BufferGeometry, LineBasicMaterial, LineSegments, Scene, StaticDrawUsage } from 'three'

const AmmoDebugConstants = {
  NoDebug: 0,
  DrawWireframe: 1,
  DrawAabb: 2,
  DrawFeaturesText: 4,
  DrawContactPoints: 8,
  NoDeactivation: 16,
  NoHelpText: 32,
  DrawText: 64,
  ProfileTimings: 128,
  EnableSatComparison: 256,
  DisableBulletLCP: 512,
  EnableCCD: 1024,
  DrawConstraints: 1 << 11, //2048
  DrawConstraintLimits: 1 << 12, //4096
  FastWireframe: 1 << 13, //8192
  DrawNormals: 1 << 14, //16384
  DrawOnTop: 1 << 15, //32768
  MAX_DEBUG_DRAW_MODE: 0xffffffff
}

/**
 * An implementation of the btIDebugDraw interface in Ammo.js, for debug rendering of Ammo shapes
 */
class DebugDrawer {
  debugDrawMode: number
  geometry: BufferGeometry
  index: number
  mesh: LineSegments
  enabled: boolean
  debugDrawer: Ammo.DebugDrawer
  warnedOnce!: boolean
  constructor(public scene: Scene, public world: Ammo.btCollisionWorld, public options: any = {}) {
    this.debugDrawMode = options.debugDrawMode || AmmoDebugConstants.DrawWireframe
    const drawOnTop = this.debugDrawMode & AmmoDebugConstants.DrawOnTop || false
    const maxBufferSize = options.maxBufferSize || 1000000

    this.geometry = new BufferGeometry()
    const vertices = new Float32Array(maxBufferSize * 3)
    const colors = new Float32Array(maxBufferSize * 3)

    /*
    I do not know the difference, just using the first one.
    export const StaticDrawUsage: Usage;
    export const DynamicDrawUsage: Usage;
    export const StreamDrawUsage: Usage;
    export const StaticReadUsage: Usage;
    export const DynamicReadUsage: Usage;
    export const StreamReadUsage: Usage;
    export const StaticCopyUsage: Usage;
    export const DynamicCopyUsage: Usage;
    export const StreamCopyUsage: Usage;
     */
    this.geometry.setAttribute('position', new BufferAttribute(vertices, 3).setUsage(StaticDrawUsage))
    this.geometry.setAttribute('color', new BufferAttribute(colors, 3).setUsage(StaticDrawUsage))

    this.index = 0

    const material = new LineBasicMaterial({
      vertexColors: true,
      depthTest: !drawOnTop
    })

    this.mesh = new LineSegments(this.geometry, material)
    if (drawOnTop) this.mesh.renderOrder = 999
    this.mesh.frustumCulled = false

    this.enabled = false

    this.debugDrawer = new Ammo.DebugDrawer()
    this.debugDrawer.drawLine = this.drawLine.bind(this)
    this.debugDrawer.drawContactPoint = this.drawContactPoint.bind(this)
    this.debugDrawer.reportErrorWarning = this.reportErrorWarning.bind(this)
    this.debugDrawer.draw3dText = this.draw3dText.bind(this)
    this.debugDrawer.setDebugMode = this.setDebugMode.bind(this)
    this.debugDrawer.getDebugMode = this.getDebugMode.bind(this)

    this.world.setDebugDrawer(this.debugDrawer)
  }

  enable() {
    this.enabled = true
    this.scene.add(this.mesh)
  }

  disable() {
    this.enabled = false
    this.scene.remove(this.mesh)
  }

  update() {
    if (!this.enabled) {
      return
    }

    if (this.index != 0) {
      // @ts-ignore
      this.geometry.attributes.position.needsUpdate = true
      // @ts-ignore
      this.geometry.attributes.color.needsUpdate = true
    }

    this.index = 0
    this.world.debugDrawWorld()
    this.geometry.setDrawRange(0, this.index)
  }

  drawLine(from: any, to: any, color: any) {
    // @ts-ignore
    const heap = Ammo.HEAPF32
    const r = heap[(color + 0) / 4]
    const g = heap[(color + 4) / 4]
    const b = heap[(color + 8) / 4]

    const fromX = heap[(from + 0) / 4]
    const fromY = heap[(from + 4) / 4]
    const fromZ = heap[(from + 8) / 4]
    this.geometry.attributes.position.setXYZ(this.index, fromX, fromY, fromZ)
    this.geometry.attributes.color.setXYZ(this.index++, r, g, b)

    const toX = heap[(to + 0) / 4]
    const toY = heap[(to + 4) / 4]
    const toZ = heap[(to + 8) / 4]
    this.geometry.attributes.position.setXYZ(this.index, toX, toY, toZ)
    this.geometry.attributes.color.setXYZ(this.index++, r, g, b)
  }

  //TODO: figure out how to make lifeTime work
  drawContactPoint(pointOnB: any, normalOnB: any, distance: any, _lifeTime: any, color: any) {
    // @ts-ignore
    const heap = Ammo.HEAPF32
    const r = heap[(color + 0) / 4]
    const g = heap[(color + 4) / 4]
    const b = heap[(color + 8) / 4]

    const x = heap[(pointOnB + 0) / 4]
    const y = heap[(pointOnB + 4) / 4]
    const z = heap[(pointOnB + 8) / 4]
    this.geometry.attributes.position.setXYZ(this.index, x, y, z)
    this.geometry.attributes.color.setXYZ(this.index++, r, g, b)

    const dx = heap[(normalOnB + 0) / 4] * distance
    const dy = heap[(normalOnB + 4) / 4] * distance
    const dz = heap[(normalOnB + 8) / 4] * distance
    this.geometry.attributes.position.setXYZ(this.index, x + dx, y + dy, z + dz)
    this.geometry.attributes.color.setXYZ(this.index++, r, g, b)
  }

  reportErrorWarning(warningString: string) {
    // eslint-disable-next-line no-prototype-builtins
    if (Ammo.hasOwnProperty('Pointer_stringify')) {
      // @ts-ignore
      console.warn(Ammo.Pointer_stringify(warningString))
    } else if (!this.warnedOnce) {
      this.warnedOnce = true
      console.warn("Cannot print warningString, please rebuild Ammo.js using 'debug' flag")
    }
  }

  draw3dText(_location: any, _textString: any) {
    //TODO
    console.warn('TODO: draw3dText')
  }

  setDebugMode(debugMode: any) {
    this.debugDrawMode = debugMode
  }

  getDebugMode() {
    return this.debugDrawMode
  }
}

export default DebugDrawer
