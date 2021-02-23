/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { ThreeGraphics } from '@enable3d/three-graphics/jsm'
import { ThreeGraphicsConfig, ExtendedObject3D, ExtendedMesh } from '@enable3d/common/dist/types'
import { Scene3D } from './scene3d'

import * as Plugins from '@enable3d/three-graphics/jsm/plugins'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { WebGLRenderer } from 'three'
import { CSG } from '@enable3d/three-graphics/jsm/csg'

/**
 * The phaser wrapper for ThreeGraphics, which is a separate module
 */
class Third extends ThreeGraphics {
  public scene3D: Scene3D
  public isXrEnabled: boolean
  public composer: EffectComposer
  // public camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,

  // plugins
  public load: Plugins.Loaders
  public lights: Plugins.Lights
  public transform: Plugins.Transform
  public heightMap: Plugins.HeightMap
  public webXR: Plugins.WebXR
  public misc: Plugins.Misc
  public cameras: Plugins.Cameras

  public csg: typeof CSG

  private factories: Plugins.Factories
  private ws: Plugins.WarpSpeed
  private mixers: Plugins.Mixers

  /**
   * Start Phaser3D
   * @param scene Add the current Phaser Scene
   * @param config Phaser3D Config
   */
  constructor(scene3D: Scene3D, config: ThreeGraphicsConfig = {}) {
    const canvas = document.getElementById('enable3d-three-canvas')
    let options = {}
    if (canvas)
      options = {
        canvas: canvas
      }

    // add a custom renderer to ThreeGraphics
    config.renderer = new WebGLRenderer({ ...options, antialias: config.antialias || false })

    super(config)

    scene3D.sys.game.canvas.parentElement?.insertBefore(config.renderer.domElement, scene3D.sys.game.canvas)
    scene3D.sys.game.canvas.style.position = 'relative'

    const resize = () => {
      if (!config.renderer) return

      const { width, height, marginLeft, marginTop } = scene3D.sys.game.canvas.style

      config.renderer.domElement.id = 'enable3d-three-canvas'

      // @ts-ignore
      this.camera?.aspect = scene3D.sys.game.scale.baseSize.width / scene3D.sys.game.scale.baseSize.height
      this.camera?.updateProjectionMatrix()

      config.renderer.setSize(scene3D.sys.game.scale.baseSize.width, scene3D.sys.game.scale.baseSize.height)

      config.renderer.domElement.style.width = width
      config.renderer.domElement.style.height = height
      config.renderer.domElement.style.marginLeft = marginLeft
      config.renderer.domElement.style.marginTop = marginTop
    }

    resize()

    scene3D.scale.on('resize', () => {
      resize()
    })

    const style = document.createElement('style')
    style.innerText = `
      #enable3d-phaser-canvas:focus,
      #enable3d-three-canvas:focus {
        outline: none;
      }

      #enable3d-three-canvas {
        position: absolute;
      }
    `
    document.head.appendChild(style)

    const { enableXR = false } = config
    this.isXrEnabled = enableXR

    //  We don't want three.js to wipe our gl context!
    // this.renderer.autoClear = false

    this.scene3D = scene3D

    // load xr plugin
    if (enableXR) {
      this.webXR = new Plugins.WebXR(this.renderer, this.scene, this.camera)
    }

    // xr renderer
    if (this.isXrEnabled) {
      let lastTime = 0
      this.renderer.setAnimationLoop((time: number) => {
        if (this.renderer.xr.isPresenting) {
          const delta = time - lastTime
          lastTime = time

          scene3D.updateLoopXR(time, delta)
          this.renderer.state.reset()

          this.preRender()
          if (this.composer) this.composer.render()
          else this.renderer.render(this.scene, this.camera)
          this.postRender()
        }
      })
    }

    const view = scene3D.add.extern()
    // @ts-ignore
    view.render = (_renderer: WebGLRenderer) => {
      if (!this.renderer.xr.isPresenting) {
        // scene3D.updateLoopXR(scene3D.sys.game.loop.time, scene3D.sys.game.loop.delta)
        // this.renderer.state.reset()
        this.preRender()
        if (this.composer) this.composer.render()
        else this.renderer.render(this.scene, this.camera)
        this.postRender()
      }
    }

    // if (!this.isXrEnabled) {
    scene3D.events.on('postupdate', (_time: number, delta: number) => {
      this.animationMixers?.update(delta)
      this.physics?.update(delta)
      this.physics?.updateDebugger()
    })
    // }

    // plugins
    this.load = new Plugins.Loaders(this.cache, this.textureAnisotropy)
    this.lights = new Plugins.Lights(this.scene)
    this.transform = new Plugins.Transform(this.camera, this.renderer)
    this.csg = CSG
    this.heightMap = new Plugins.HeightMap(this.scene)
    this.factories = new Plugins.Factories(this.scene)
    this.misc = new Plugins.Misc(this.scene, this.renderer, this.factories)
    this.cameras = new Plugins.Cameras()
    this.ws = new Plugins.WarpSpeed(
      this.scene,
      this.renderer,
      this.camera,
      this.lights,
      this.physics,
      this.load,
      this.factories
    )
    this.mixers = new Plugins.Mixers()

    // remove the update event which is used by ThreeGraphics.ts and AmmoPhysics.ts
    scene3D.events.once('shutdown', () => {
      // view.destroy(true)
      // this.renderer.dispose()
      // this.renderer.domElement.remove()
      scene3D.clearThirdDimension()
      scene3D.events.removeListener('update')
    })
  }

  /** Will be called before THREE.WebGLRenderer.render() */
  public preRender() {}
  /** Will be called after THREE.WebGLRenderer.render() */
  public postRender() {}

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
  public haveSomeFun(numberOfElements: number = 20) {
    Plugins.HaveSomeFun(numberOfElements, this.physics)
  }
  public get animationMixers() {
    return this.mixers?.mixers
  }
  public get make() {
    return this.factories.make
  }
  public get add() {
    return this.factories.add
  }
}

export default Third
