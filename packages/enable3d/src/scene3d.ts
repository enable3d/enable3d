/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|LGPL-3.0}
 */

import { ThreeGraphics } from '@enable3d/three-graphics/jsm'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { Clock, WebGLRenderer } from 'three'
import { ExtendedMesh, ExtendedObject3D } from '@enable3d/common/dist/types.js'
import { AmmoPhysics } from '@enable3d/ammo-physics'
import { CSG } from '@enable3d/three-graphics/jsm/csg'

import * as Plugins from '@enable3d/three-graphics/jsm/plugins'

// https://www.typescriptlang.org/docs/handbook/utility-types.html Pick<T,K>
// export class Scene3D implements Partial<ThreeGraphics> {
export class Scene3D implements Partial<ThreeGraphics> {
  // core modules from three-graphics
  public scenes: Map<string, Scene3D> = new Map()
  public scene!: ThreeGraphics['scene']
  public camera!: ThreeGraphics['camera']
  public cache!: ThreeGraphics['cache']
  public physics!: AmmoPhysics
  public renderer!: WebGLRenderer
  public composer!: EffectComposer
  public parent!: HTMLElement
  public canvas!: HTMLCanvasElement
  public clock!: Clock

  // public plugins
  public load!: Plugins.Loaders
  public lights!: Plugins.Lights
  public transform!: Plugins.Transform
  public heightMap!: Plugins.HeightMap
  public webXR!: Plugins.WebXR
  public misc!: Plugins.Misc
  public cameras!: Plugins.Cameras

  // other
  public csg!: typeof CSG

  // private plugins
  private factories!: Plugins.Factories
  private ws!: Plugins.WarpSpeed
  private mixers!: Plugins.Mixers

  public __config: any = {}
  private _isRunning: boolean = false
  private _deconstructor: any[] = []

  constructor(private sceneConfig: { key?: string; enableXR?: boolean } = {}) {
    const { key = Math.random().toString(), enableXR = false } = sceneConfig
    this.__config.sceneKey = key
    this.__config.enableXR = enableXR
  }

  /** Pass all objects you want to destroy on scene restart or stop. */
  public get deconstructor() {
    return {
      /**
       * Pass an your objects.
       * @example
       * // this is what the deconstructor does on
       * // scene restart or stop to all objects added:
       * await object.dispose?.()
       * await object.destroy?.()
       * if (typeof object === 'function') await object?.()
       * object = null
       */
      add: (...object: any[]) => {
        object.forEach(o => {
          this._deconstructor.push(o)
        })
      }
    }
  }

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
    this.load = new Plugins.Loaders(this.cache, textureAnisotropy)
    this.lights = new Plugins.Lights(this.scene)
    this.transform = new Plugins.Transform(this.camera, this.renderer)
    this.csg = CSG
    this.heightMap = new Plugins.HeightMap(this.scene)
    this.factories = new Plugins.Factories(this.scene)
    this.misc = new Plugins.Misc(this.scene, this.renderer, this.factories)
    this.ws = new Plugins.WarpSpeed(scene, renderer, camera, this.lights, this.physics, this.load, this.factories)
    this.mixers = new Plugins.Mixers()
    this.cameras = new Plugins.Cameras()

    this.clock = new Clock()

    // add vr camera
    if (this.__config.enableXR) {
      this.webXR = new Plugins.WebXR(this.renderer, this.scene)
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
    // @ts-expect-error: ExtendedObject3D and ExtendedMesh can't be null.
    obj = null
  }
  public async warpSpeed(...features: Plugins.WarpedStartFeatures[]): Promise<Plugins.WarpSpeedOptions> {
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

    // console.log('start')

    this.renderer.setAnimationLoop(() => {
      this._update()
    })

    this._isRunning = true
  }

  public async restart(data?: any) {
    await this.stop()
    await this.start(this.__config.sceneKey, data)
  }

  public async stop() {
    this._isRunning = false
    this.renderer.setAnimationLoop(null)

    // reset clock
    this.clock.start()

    for (let object of this._deconstructor) {
      await object.dispose?.()
      await object.destroy?.()
      if (typeof object === 'function') await object?.()
      object = null
    }
    this._deconstructor = []

    // destroy all rigid bodies
    if (this.physics?.rigidBodies)
      for (let i = this.physics.rigidBodies.length - 1; i >= 0; i--) {
        this.physics.destroy(this.physics.rigidBodies[i])
      }

    // destroy all three objects
    for (let i = this.scene.children.length - 1; i >= 0; i--) {
      this.scene.remove(this.scene.children[i])
    }
  }

  public setSize(width: number, height: number) {
    this.renderer.setSize(width, height)

    if (typeof (this.camera as THREE.PerspectiveCamera).aspect !== 'undefined')
      (this.camera as THREE.PerspectiveCamera).aspect = width / height
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

  public init(data: any = {}) {}
  public preload() {}
  public create() {}
  public update(_time: number, _delta: number) {}
  /** Will be called before THREE.WebGLRenderer.render() */
  public preRender() {}
  /** Will be called after THREE.WebGLRenderer.render() */
  public postRender() {}

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

    this.preRender()
    if (this.composer) this.composer.render()
    else this.renderer.render(this.scene, this.camera)
    this.postRender()
  }
}
