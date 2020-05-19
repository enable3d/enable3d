import {
  Scene,
  PerspectiveCamera,
  OrthographicCamera,
  WebGLRenderer,
  AmbientLight,
  DirectionalLight
} from '@enable3d/three-wrapper/dist'

import { Sky, OrbitControls } from '@enable3d/three-wrapper/dist/index'
import * as THREE from '@enable3d/three-wrapper/dist/index'
import Cameras from './cameras'
import { Lights, Loaders, Factories } from '.'
import { AmmoPhysics, ExtendedObject3D } from '@enable3d/ammo-physics'

export type WarpedStartFeatures =
  | 'light'
  | 'camera'
  | 'lookAtCenter'
  | 'ground'
  | 'grid'
  | 'orbitControls'
  | 'fog'
  | 'sky'
  | '-light'
  | '-camera'
  | '-lookAtCenter'
  | '-ground'
  | '-grid'
  | '-orbitControls'
  | '-fog'
  | '-sky'

export default class WarpSpeed {
  constructor(
    private scene: Scene,
    private renderer: WebGLRenderer,
    private camera: PerspectiveCamera | OrthographicCamera,
    private lights: Lights,
    private physics: AmmoPhysics,
    private load: Loaders,
    private factories: Factories
  ) {}
  /**
   * It takes took long to setup the third dimension your self? Get started with warp speed by using this function.
   * @param features Pass the features you want to setup.
   */
  async warpSpeed(...features: WarpedStartFeatures[]) {
    let Features: {
      camera?: PerspectiveCamera | OrthographicCamera
      lights?: {
        ambientLight: AmbientLight
        directionalLight: DirectionalLight
      }
      ground?: ExtendedObject3D
      orbitControls?: OrbitControls
    } = {}

    // test for negative features
    const negativeFeatures = features.filter(feature => /^-\w+/.test(feature))
    const hasNegativeFeatures = negativeFeatures.length > 0 ? true : false

    // add all features
    if (features.length === 0 || hasNegativeFeatures)
      features = ['light', 'camera', 'lookAtCenter', 'ground', 'grid', 'orbitControls', 'fog', 'sky']

    // remove the negative features
    if (hasNegativeFeatures) {
      const featuresToRemove = negativeFeatures.map(feature => feature.substr(1))
      featuresToRemove.forEach(feature => {
        // @ts-ignore
        const index = features.indexOf(feature)
        features.splice(index, 1)
      })
    }

    // TODO: add fog
    if (features.includes('fog')) {
    }

    if (features.includes('sky')) {
      const sky = new Sky()
      sky.scale.setScalar(450000)
      this.scene.add(sky)

      const sunSphere = new THREE.Mesh(
        new THREE.SphereBufferGeometry(20000, 16, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      )
      sunSphere.position.y = -700000
      sunSphere.visible = false
      this.scene.add(sunSphere)

      const effectController = {
        turbidity: 10,
        rayleigh: 2,
        mieCoefficient: 0.005,
        mieDirectionalG: 0.8,
        luminance: 1,
        inclination: 0.25, // elevation / inclination
        azimuth: 0.25, // Facing front,
        sun: !true
      }

      const distance = 400000

      const uniforms = sky.material.uniforms
      uniforms['turbidity'].value = effectController.turbidity
      uniforms['rayleigh'].value = effectController.rayleigh
      uniforms['mieCoefficient'].value = effectController.mieCoefficient
      uniforms['mieDirectionalG'].value = effectController.mieDirectionalG
      uniforms['luminance'].value = effectController.luminance

      const theta = Math.PI * (effectController.inclination - 0.5)
      const phi = 2 * Math.PI * (effectController.azimuth - 0.5)

      sunSphere.position.x = distance * Math.cos(phi)
      sunSphere.position.y = distance * Math.sin(phi) * Math.sin(theta)
      sunSphere.position.z = distance * Math.sin(phi) * Math.cos(theta)

      sunSphere.visible = effectController.sun

      uniforms['sunPosition'].value.copy(sunSphere.position)
    }

    if (features.includes('camera')) {
      this.camera.position.set(5, 5, 10)
      Features = { camera: this.camera, ...Features }
    }

    if (features.includes('light')) {
      const ambientLight = this.lights.ambientLight({ color: 0xcccccc })
      const directionalLight = this.lights.directionalLight({ color: 0xffffff, intensity: 0.5, x: -10, y: 18, z: 5 })
      const d = 20
      directionalLight.shadow.camera.top = d
      directionalLight.shadow.camera.bottom = -d
      directionalLight.shadow.camera.left = -d
      directionalLight.shadow.camera.right = d

      directionalLight.shadow.mapSize.set(1024, 1024)
      // this.directionalLight = light
      const lights = {
        ambientLight,
        directionalLight
      }

      Features = { lights, ...Features }
    }

    if (features.includes('lookAtCenter')) {
      this.camera.lookAt(this.scene.position)
    }

    if (features.includes('ground')) {
      // grid (texture)
      const addGrid = features.includes('grid')
      const gridData =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOnAAADusBZ+q87AAAAJtJREFUeJzt0EENwDAAxLDbNP6UOxh+NEYQ5dl2drFv286598GrA7QG6ACtATpAa4AO0BqgA7QG6ACtATpAa4AO0BqgA7QG6ACtATpAa4AO0BqgA7QG6ACtATpAa4AO0BqgA7QG6ACtATpAa4AO0BqgA7QG6ACtATpAa4AO0BqgA7QG6ACtATpAa4AO0BqgA7QG6ACtATpAu37AD8eaBH5JQdVbAAAAAElFTkSuQmCC'

      const texture = await this.load.texture(gridData)

      texture.wrapS = texture.wrapT = THREE.RepeatWrapping
      texture.repeat.set(21, 21)

      // ground
      const geometry = { name: 'ground', width: 21, height: 21, depth: 1, y: -0.5 }
      const material = {
        phong: { map: addGrid ? texture : null, transparent: true, opacity: 0.8, color: 0xffffff }
      }

      let ground: ExtendedObject3D

      if (window.__loadPhysics) {
        ground = this.physics.add.ground(geometry, material)
        ground.body.setRestitution(1)
      } else {
        ground = this.factories.add.ground(geometry, material)
      }
      ground.receiveShadow = true

      Features = { ground, ...Features }
    }

    if (features.includes('orbitControls')) {
      // for phaser
      // this.root is the phaser scene (scene3D)
      // this.root.scale.parent instead of this.renderer.domElement
      const orbitControls = new OrbitControls(this.camera, this.renderer.domElement)
      Features = { orbitControls, ...Features }
    }

    return Features
  }
}
