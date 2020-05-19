/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { ThreeGraphics } from '@enable3d/three-graphics/dist/index'
import { Scene3D } from './scene3d'
import { ThreeGraphicsConfig } from '@enable3d/common/dist/types'

interface Scene3DConfig extends ThreeGraphicsConfig {
  parent?: string
  autoStart?: boolean
  scenes: typeof Scene3D[]
}

export class Project extends ThreeGraphics {
  public parent: HTMLElement
  public canvas: HTMLCanvasElement
  public scenes: Map<string, Scene3D> = new Map()

  constructor(private projectConfig: Scene3DConfig) {
    super(projectConfig)

    this.renderer.setSize(window.innerWidth, window.innerHeight)

    this.parent = this.projectConfig.parent
      ? (document.getElementById(this.projectConfig.parent) as HTMLElement)
      : document.body
    if (this.parent) this.parent.appendChild(this.renderer.domElement)
    else console.error(`[enable3d] parent "${this.projectConfig.parent}" not found!`)
    this.canvas = this.renderer.domElement

    let firstSceneKey = ''
    this.projectConfig.scenes.forEach((scene, i) => {
      const s = new scene()
      if (i === 0) firstSceneKey = s.sceneKey
      const plug = {
        // scene configuration
        sceneConfig: {
          textureAnisotropy: this.textureAnisotropy,
          autoStart: false
        },
        // add core features from three-graphicsconfig: {
        renderer: this.renderer,
        parent: this.parent,
        canvas: this.canvas,
        scene: this.scene, // three scene
        scenes: this.scenes, // access to all Scene3D's
        camera: this.camera,
        cache: this.cache,
        physics: this.physics
      }

      s.initializeScene(plug)

      if (i === 0) {
        s.setSize(this.parent.clientWidth, this.parent.clientHeight)
        s.setPixelRatio(Math.max(1, window.devicePixelRatio / 2))
      }

      this.scenes.set(s.sceneKey, s)
    })
    // start the first scene
    this.scenes.get(firstSceneKey)?.start(firstSceneKey)
  }
}
