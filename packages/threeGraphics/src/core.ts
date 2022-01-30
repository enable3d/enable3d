/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { Cache, Scene, WebGLRenderer, PerspectiveCamera, OrthographicCamera, PCFSoftShadowMap } from 'three'
import type * as Types from '@enable3d/common/dist/types'
import Cameras from './plugins/cameras'
import { AmmoPhysics } from '@enable3d/ammo-physics/dist/index'
import { sRGBEncoding } from 'three'
import { logger } from '@enable3d/common/dist/logger'

export class ThreeGraphics {
  public cache: typeof Cache
  public scene: Scene
  public renderer: WebGLRenderer
  public camera: PerspectiveCamera | OrthographicCamera
  protected textureAnisotropy: number

  public cameras!: Cameras
  public physics!: AmmoPhysics

  constructor(protected threeGraphicsConfig: Types.ThreeGraphicsConfig = {}) {
    const {
      alpha = false,
      anisotropy = 1,
      camera = Cameras.Perspective({ z: 25, y: 5 }),
      antialias = false,
      usePhysics = true,
      renderer
    } = threeGraphicsConfig

    this.textureAnisotropy = anisotropy
    this.camera = camera

    this.scene = new Scene()

    // this.renderer.physicallyCorrectLights = true
    this.renderer = renderer || new WebGLRenderer({ antialias, alpha })

    // see https://threejs.org/docs/#examples/en/loaders/GLTFLoader
    // this.renderer.outputEncoding = sRGBEncoding

    // shadow
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = PCFSoftShadowMap

    // enable cache
    this.cache = Cache
    this.cache.enabled = true

    if (usePhysics) {
      if (typeof Ammo !== 'undefined') this.physics = new AmmoPhysics(this.scene, threeGraphicsConfig)
      else logger('Are you sure you included ammo.js?')
    }
  }

  // get new() {
  //   return {
  //     lerp: (x: number, y: number, t: number) => MathUtils.lerp(x, y, t),
  //     /** A simple js Object3D. */
  //     object3D: () => new Object3D(),
  //     /** An extended js Object3D with useful properties and methods. */
  //     extendedObject3D: () => new ExtendedObject3D(),
  //     /** Create a Path Shape */
  //     shape: () => new Shape(),
  //     shapePath: () => new ShapePath(),
  //     path: () => new Path(),
  //     svgLoader: () => new SVGLoader(),
  //     raycaster: () => new Raycaster(),
  //     group: () => new Group(),
  //     color: (color?: string | number | Color | undefined) => new Color(color),
  //     box3: () => new Box3(),
  //     box3Helper: (box3: Box3) => new Box3Helper(box3),
  //     boxHelper: (mesh: Mesh) => new BoxHelper(mesh),
  //     // animationMixer: (root: Object3D) => this.animationMixer(root),
  //     vector2: (x?: number, y?: number) => new Vector2(x, y),
  //     vector3: (x?: number, y?: number, z?: number) => new Vector3(x, y, z),
  //     euler: (x: number, y: number, z: number) => new Euler(x, y, z, 'XYZ'),
  //     quaternion: (x?: number, y?: number, z?: number, w?: number) => new Quaternion(x, y, z, w),
  //     defaultMaterial: () => this.getDefaultMaterial()
  //   }
  // }

  // protected getDefaultMaterial(): Material {
  //   return this.defaultMaterial.get()
  // }

  // public radToDeg(number: number) {
  //   return MathUtils.radToDeg(number)
  // }

  // /**
  //  * Add OrbitControls to your scene
  //  * @param camera Pass the current camera (this.three.camera)
  //  * @param parent Pass the parent object of the Canvas (this.scale.parent)
  //  */
  // static OrbitControls(camera: any, parent: any) {
  //   return new OrbitControls(camera, parent)
  // }

  // public get on() {
  //   return {
  //     /**
  //      * This returns all collisions of all object. Maybe you are looking for 'this.third.physics.add.collider(body1, body2, callback)' instead?
  //      */
  //     collision: (
  //       eventCallback: (data: { bodies: ExtendedObject3D[]; event: CollisionEvent }) => void
  //     ) => {
  //       this.physics.on('collision', (data: { bodies: ExtendedObject3D[]; event: CollisionEvent }) => {
  //         eventCallback(data)
  //       })
  //     }
  //   }
  // }
}
