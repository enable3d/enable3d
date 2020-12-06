/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { ThreeGraphics } from '@enable3d/three-graphics/dist/index'
import { Clock, WebGLRenderer } from '@enable3d/three-wrapper/dist/index'
import { ExtendedObject3D, ExtendedMesh } from '@enable3d/common/dist/types'
import { AmmoPhysics } from '@enable3d/ammo-physics'

import * as Plugins from '@enable3d/three-graphics/dist/plugins/index'

// https://www.typescriptlang.org/docs/handbook/utility-types.html Pick<T,K>
// export class Scene3D implements Partial<ThreeGraphics> {
export class Scene3D implements Partial<ThreeGraphics> {
  // core modules from three-graphics
  public scenes: Map<string, Scene3D> = new Map()
  public scene: ThreeGraphics['scene']
  public camera: ThreeGraphics['camera']
  public cache: ThreeGraphics['cache']
  public physics: AmmoPhysics
  public renderer: WebGLRenderer
  public parent: HTMLElement
  public canvas: HTMLCanvasElement
  public clock: Clock

  // public plugins
  public load: Plugins.Loaders
  public lights: Plugins.Lights
  public transform: Plugins.Transform
  public csg: Plugins.CSG
  public heightMap: Plugins.HeightMap
  public webXR: Plugins.WebXR
  public misc: Plugins.Misc
  public cameras: Plugins.Cameras

  // private plugins
  private factories: Plugins.Factories
  private ws: Plugins.WarpSpeed
  private mixers: Plugins.Mixers

  public __config: any = {}
  private _isRunning: boolean = false
  private _deconstructorFunctions: Function[] = []

  constructor(private sceneConfig: { key?: string; enableXR?: boolean } = {}) {
    const { key = Math.random().toString(), enableXR = false } = sceneConfig
    this.__config.sceneKey = key
    this.__config.enableXR = enableXR
  }

  public get deconstructor() {
    return {
      add: (fnc: Function) => {
        this._deconstructorFunctions.push(fnc)
      }
    }
  }

  // @ts-ignore
  public initializeScene(plugins: any) {
    const { renderer, parent, canvas, scene, scenes, camera, cache, physics, sceneConfig } = plugins
    this.scene = scene
    this.scenes = scenes
    this.camera = camera
    this.cache = cache
    this.physics = physics
    this.renderer = renderer
    this.parent = parent
    this.canvas = canvas

    const { autoStart, textureAnisotropy } = sceneConfig

    // plugins
    this.load = new Plugins.Loaders(this.cache, textureAnisotropy, this.renderer.outputEncoding)
    this.lights = new Plugins.Lights(this.scene)
    this.transform = new Plugins.Transform(this.camera, this.renderer)
    this.csg = new Plugins.CSG(this.scene, this.transform)
    this.heightMap = new Plugins.HeightMap(this.scene)
    this.factories = new Plugins.Factories(this.scene)
    this.misc = new Plugins.Misc(this.scene, this.renderer, this.factories)
    this.ws = new Plugins.WarpSpeed(scene, renderer, camera, this.lights, this.physics, this.load, this.factories)
    this.mixers = new Plugins.Mixers()
    this.cameras = new Plugins.Cameras()

    this.clock = new Clock()

    // add vr camera
    if (this.__config.enableXR) {
      this.webXR = Plugins.WebXR.Enable(this.renderer, this.camera)
    }

    if (autoStart) this.start(this.__config.sceneKey)
  }

  public get sceneKey() {
    return this.__config.sceneKey
  }

  /** Destroys a object and its body. */
  public destroy(obj: ExtendedObject3D | ExtendedMesh) {
    this.physics?.destroy(obj.body)
    this.scene.remove(obj)
    // @ts-ignore
    obj = null
  }
  public async warpSpeed(...features: Plugins.WarpedStartFeatures[]) {
    return await this.ws.warpSpeed(...features)
  }
  public get animationMixers() {
    return this.mixers.mixers
  }
  public get make() {
    return this.factories.make
  }
  public get add() {
    return this.factories.add
  }
  public haveSomeFun(numberOfElements: number = 20) {
    Plugins.HaveSomeFun(numberOfElements, this.physics)
  }

  public isRunning() {
    return this._isRunning
  }

  public async start(key?: string, data?: any) {
    // start another scene
    // and stop this one
    if (key && key !== this.__config.sceneKey) {
      this.stop()
      this.scenes.get(key)?._start(data)
    } else {
      this._start(data)
    }
  }

  private async _start(data?: any) {
    await this.init?.(data)
    await this._preload()
    await this._create()

    this.renderer.setAnimationLoop(() => {
      this._update()
    })

    this._isRunning = true
  }

  public async restart(data?: any) {
    this.stop()
    this.start(this.__config.sceneKey, data)
  }

  public async stop() {
    this._isRunning = false
    this.renderer.setAnimationLoop(null)

    // reset clock
    this.clock.start()

    for (let i = 0; i < this._deconstructorFunctions.length; i++) {
      await this._deconstructorFunctions[i]()
    }
    this._deconstructorFunctions = []

    // destroy all rigid bodies
    for (let i = Object.keys(this.physics.objectsAmmo).length - 1; i >= 0; i--) {
      this.physics.destroy(Object.values(this.physics.objectsAmmo)[i].body)
    }

    // destroy all three objects
    for (let i = this.scene.children.length - 1; i >= 0; i--) {
      this.scene.remove(this.scene.children[i])
    }
  }

  public setSize(width: number, height: number) {
    this.renderer.setSize(width, height)
    // @ts-ignore
    if (typeof this.camera.aspect !== 'undefined') this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  public setPixelRatio(ratio: number) {
    this.renderer.setPixelRatio(ratio)
  }

  // public get controls() {
  //   return {
  //     pointerDrag: (autoStart = true) => new PointerDrag(this.canvas, autoStart),
  //     pointerLock: (autoLock = true) => new PointerLock(this.canvas, autoLock),
  //     joystick: () => new JoyStick(),
  //     firstPerson: (target: ExtendedObject3D, config: FirstPersonControlsConfig = {}) =>
  //       new FirstPersonControls(this.camera, target, config),
  //     thirdPerson: (target: ExtendedObject3D, config: ThirdPersonControlsConfig = {}) =>
  //       new ThirdPersonControls(this.camera, target, config)
  //   }
  // }

  // @ts-ignore
  public init(data: any = {}) {}
  public preload() {}
  public create() {}
  public update(_time: number, _delta: number) {}
  private async _preload() {
    await this.preload?.()
  }
  private async _create() {
    await this.create?.()
  }
  private _update() {
    const delta = this.clock.getDelta() * 1000
    const time = this.clock.getElapsedTime()

    this.update?.(parseFloat(time.toFixed(3)), parseInt(delta.toString()))
    this.physics?.update(delta)
    this.physics?.updateDebugger()

    this.animationMixers.update(delta)
    this.renderer.render(this.scene, this.camera)
  }
}
