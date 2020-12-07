/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import * as THREE from '@enable3d/three-wrapper/dist/index'
import * as Types from '@enable3d/common/dist/types'
import Cameras from './plugins/cameras'
import { AmmoPhysics } from '@enable3d/ammo-physics/dist/index'
import { sRGBEncoding } from '@enable3d/three-wrapper/dist/index'

export class ThreeGraphics {
  public cache: typeof THREE.Cache
  public scene: THREE.Scene
  public renderer: THREE.WebGLRenderer
  public camera: THREE.PerspectiveCamera | THREE.OrthographicCamera
  protected textureAnisotropy: number

  public cameras: Cameras
  public physics: AmmoPhysics

  constructor(protected threeGraphicsConfig: Types.ThreeGraphicsConfig = {}) {
    const {
      anisotropy = 1,
      camera = Cameras.Perspective({ z: 25, y: 5 }),
      antialias = false,
      usePhysics = true,
      renderer
    } = threeGraphicsConfig

    this.textureAnisotropy = anisotropy
    this.camera = camera

    this.scene = new THREE.Scene()

    // this.renderer.physicallyCorrectLights = true
    this.renderer = renderer || new THREE.WebGLRenderer({ antialias })
    // this.renderer.outputEncoding = THREE.GammaEncoding
    // this.renderer.gammaFactor = 1

    // this.renderer.physicallyCorrectLights = true
    this.renderer.outputEncoding = sRGBEncoding

    // shadow
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // enable cache
    this.cache = THREE.Cache
    this.cache.enabled = true

    if (usePhysics) {
      if (typeof Ammo !== 'undefined') this.physics = new AmmoPhysics(this.scene, threeGraphicsConfig)
      else console.log('[enable3d]: Are you sure you included ammo.js?')
    }
  }

  // get new() {
  //   return {
  //     lerp: (x: number, y: number, t: number) => THREE.MathUtils.lerp(x, y, t),
  //     /** A simple THREE.js Object3D. */
  //     object3D: () => new THREE.Object3D(),
  //     /** An extended THREE.js Object3D with useful properties and methods. */
  //     extendedObject3D: () => new ExtendedObject3D(),
  //     /** Create a Path Shape */
  //     shape: () => new THREE.Shape(),
  //     shapePath: () => new THREE.ShapePath(),
  //     path: () => new THREE.Path(),
  //     svgLoader: () => new SVGLoader(),
  //     raycaster: () => new THREE.Raycaster(),
  //     group: () => new THREE.Group(),
  //     color: (color?: string | number | THREE.Color | undefined) => new THREE.Color(color),
  //     box3: () => new THREE.Box3(),
  //     box3Helper: (box3: THREE.Box3) => new THREE.Box3Helper(box3),
  //     boxHelper: (mesh: THREE.Mesh) => new THREE.BoxHelper(mesh),
  //     // animationMixer: (root: THREE.Object3D) => this.animationMixer(root),
  //     vector2: (x?: number, y?: number) => new THREE.Vector2(x, y),
  //     vector3: (x?: number, y?: number, z?: number) => new THREE.Vector3(x, y, z),
  //     euler: (x: number, y: number, z: number) => new THREE.Euler(x, y, z, 'XYZ'),
  //     quaternion: (x?: number, y?: number, z?: number, w?: number) => new THREE.Quaternion(x, y, z, w),
  //     defaultMaterial: () => this.getDefaultMaterial()
  //   }
  // }

  // protected getDefaultMaterial(): THREE.Material {
  //   return this.defaultMaterial.get()
  // }

  // public radToDeg(number: number) {
  //   return THREE.MathUtils.radToDeg(number)
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
