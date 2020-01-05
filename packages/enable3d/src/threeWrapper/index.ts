/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2019 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { Scene as PhaserScene } from 'phaser'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'

import {
  PerspectiveCamera as THREE_PerspectiveCamera,
  OrthographicCamera as THREE_OrthographicCamera,
  Scene,
  WebGLRenderer,
  Mesh,
  Math as THREE_Math,
  Box3,
  Box3Helper,
  BoxHelper,
  AnimationMixer,
  Vector2,
  Vector3,
  Object3D,
  Line,
  Points,
  Color,
  Euler,
  Quaternion,
  PCFSoftShadowMap,
  MeshStandardMaterial,
  MeshStandardMaterialParameters,
  Shape,
  Group,
  ShapePath,
  Path
} from 'three/src/Three'

import {
  BoxConfig,
  GroundConfig,
  SphereConfig,
  BoxObject,
  SphereObject,
  GroundObject,
  CylinderObject,
  Phaser3DConfig,
  MaterialConfig,
  CylinderConfig,
  ExtrudeConfig,
  ExtrudeObject
} from '../types'
import ExtendedObject3D from '../extendedObject3D'
import applyMixins from '../helpers/applyMixins'
import Loaders from './loaders'
import Cameras from './cameras'
import Textures from './textures'
import Lights from './lights'
import Factories from './factories'
import CSG from './csg'

interface ThreeWrapper extends Loaders, Cameras, Textures, Lights, Factories, CSG {}

class ThreeWrapper {
  public scene: Scene
  private view: any
  protected renderer: WebGLRenderer
  private composer: null
  private mixers: AnimationMixer[] = []
  public camera: THREE_PerspectiveCamera | THREE_OrthographicCamera

  constructor(public root: PhaserScene, config: Phaser3DConfig = {}) {
    const { anisotropy = 1, camera = Cameras.PerspectiveCamera(root, { z: 25, y: 5 }) } = config
    this.camera = camera
    this.view = root.add.extern()
    this.scene = new Scene()
    this.textureAnisotropy = anisotropy
    this.renderer = new WebGLRenderer({
      canvas: root.sys.game.canvas as HTMLCanvasElement,
      context: root.sys.game.context as WebGLRenderingContext,
      antialias: true
    })

    // shadow
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = PCFSoftShadowMap

    this.composer = null
    //  We don't want three.js to wipe our gl context!
    this.renderer.autoClear = false
    //  Create our Extern render callback
    this.view.render = () => {
      //  This is important to retain GL state between renders
      this.renderer.state.reset()
      this.renderer.render(this.scene, this.camera)
    }

    root.events.on('update', (_time: number, delta: number) => {
      this.mixers?.forEach(mixer => mixer.update(delta / 1000))
    })
  }

  get new() {
    return {
      /** A simple THREE.js Object3D. */
      object3D: () => new Object3D(),
      /** An extended THREE.js Object3D with useful properties and methods. */
      extendedObject3D: () => new ExtendedObject3D(),
      /** Create a Path Shape */
      shape: () => new Shape(),
      shapePath: () => new ShapePath(),
      path: () => new Path(),
      svgLoader: () => new SVGLoader(),

      group: () => new Group(),
      color: (color?: string | number | Color | undefined) => new Color(color),
      box3: () => new Box3(),
      box3Helper: (box3: Box3) => new Box3Helper(box3),
      boxHelper: (mesh: Mesh) => new BoxHelper(mesh),
      animationMixer: (root: Object3D) => this.animationMixer(root),
      vector2: (x?: number, y?: number) => new Vector2(x, y),
      vector3: (x?: number, y?: number, z?: number) => new Vector3(x, y, z),
      euler: (x: number, y: number, z: number) => new Euler(x, y, z, 'XYZ'),
      quaternion: (x?: number, y?: number, z?: number, w?: number) => new Quaternion(x, y, z, w),
      standardMaterial: (parameters?: MeshStandardMaterialParameters) => new MeshStandardMaterial(parameters)
    }
  }

  private animationMixer(root: Object3D) {
    const mixer = new AnimationMixer(root)
    this.mixers.push(mixer)
    return mixer
  }

  get load() {
    return {
      texture: (url: string) => this.loadTexture(url),
      gltf: (key: string, cb: Function) => this.loadGLTF(key, cb),
      fbx: (path: string, cb: (object: any) => void) => this.loadFBX(path, cb)
    }
  }

  get loadAsync() {
    return {
      texture: (url: string) => this.loadAsyncTexture(url)
    }
  }

  //  Some basic factory helpers
  public get add(): {
    directionalLight: any
    hemisphereLight: any
    ambientLight: any
    mesh: any
    existing: any
    box: BoxObject
    ground: GroundObject
    sphere: SphereObject
    cylinder: CylinderObject
    extrude: ExtrudeObject
  } {
    return {
      //  Lights
      // ambientLight: config => this.addAmbientLight(config),
      directionalLight: (config: any = {}) => this.addDirectionalLight(config),
      hemisphereLight: (config: any = {}) => this.addHemisphereLight(config),
      ambientLight: (config: any = {}) => this.addAmbientLight(config),
      // pointLight: config => this.addPointLight(config),
      // spotLight: config => this.addSpotLight(config),

      // effectComposer: () => this.addEffectComposer(),
      mesh: (mesh: any) => this.addMesh(mesh),
      // group: (...children) => this.addGroup(children),
      existing: (object: ExtendedObject3D | Mesh | Line | Points) => this.addExisting(object),
      //  Geometry
      box: (boxConfig: BoxConfig = {}, materialConfig: MaterialConfig = {}) => this.addBox(boxConfig, materialConfig),
      ground: (groundConfig: GroundConfig, materialConfig: MaterialConfig = {}) =>
        this.addGround(groundConfig, materialConfig),
      //...
      sphere: (sphereConfig: SphereConfig = {}, materialConfig: MaterialConfig = {}) =>
        this.addSphere(sphereConfig, materialConfig),
      cylinder: (cylinderConfig: CylinderConfig = {}, materialConfig: MaterialConfig = {}) =>
        this.addCylinder(cylinderConfig, materialConfig),
      extrude: (extrudeConfig: ExtrudeConfig, materialConfig: MaterialConfig = {}) =>
        this.addExtrude(extrudeConfig, materialConfig)
      //...
    }
  }

  private addExisting(object: ExtendedObject3D | Mesh | Line | Points) {
    this.scene.add(object)
  }

  public radToDeg(number: number) {
    return THREE_Math.radToDeg(number)
  }

  public get make(): { box: BoxObject; sphere: SphereObject; cylinder: CylinderObject; extrude: ExtrudeObject } {
    return {
      box: (boxConfig: BoxConfig = {}, materialConfig: MaterialConfig = {}) => this.makeBox(boxConfig, materialConfig),
      sphere: (sphereConfig: SphereConfig = {}, materialConfig: MaterialConfig = {}) =>
        this.makeSphere(sphereConfig, materialConfig),
      cylinder: (cylinderConfig: CylinderConfig = {}, materialConfig: MaterialConfig = {}) =>
        this.makeCylinder(cylinderConfig, materialConfig),
      extrude: (extrudeConfig: ExtrudeConfig, materialConfig: MaterialConfig = {}) =>
        this.makeExtrude(extrudeConfig, materialConfig)
    }
  }

  static OrbitControls(camera: any, parent: any) {
    return new OrbitControls(camera, parent)
  }
}

applyMixins(ThreeWrapper, [Loaders, Cameras, Textures, Lights, Factories, CSG])

export default ThreeWrapper
