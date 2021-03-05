import {
  Scene,
  PerspectiveCamera,
  OrthographicCamera,
  WebGLRenderer,
  AmbientLight,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  BackSide,
  ShaderMaterial,
  SphereBufferGeometry,
  Color,
  RepeatWrapping
} from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Lights, Loaders, Factories } from '.'
import { AmmoPhysics, ExtendedObject3D } from '@enable3d/ammo-physics'

export interface WarpSpeedOptions {
  camera?: PerspectiveCamera | OrthographicCamera | undefined
  lights?:
    | {
        ambientLight: AmbientLight
        directionalLight: DirectionalLight
        hemisphereLight: HemisphereLight
      }
    | undefined
  ground?: ExtendedObject3D | undefined
  orbitControls?: OrbitControls | undefined
}

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
  async warpSpeed(...features: WarpedStartFeatures[]): Promise<WarpSpeedOptions> {
    let Features: {
      camera?: PerspectiveCamera | OrthographicCamera
      lights?: {
        ambientLight: AmbientLight
        directionalLight: DirectionalLight
        hemisphereLight: HemisphereLight
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
      // https://github.com/mrdoob/three.js/blob/master/examples/webgl_lights_hemisphere.html

      // SKYDOME

      const vertexShader = [
        'varying vec3 vWorldPosition;',
        '',
        'void main() {',
        '',
        'vec4 worldPosition = modelMatrix * vec4( position, 1.0 );',
        'vWorldPosition = worldPosition.xyz;',
        '',
        'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '',
        '}'
      ].join('\n')

      const fragmentShader = [
        'uniform vec3 topColor;',
        'uniform vec3 bottomColor;',
        'uniform float offset;',
        'uniform float exponent;',
        '',
        'varying vec3 vWorldPosition;',
        '',
        'void main() {',
        '',
        'float h = normalize( vWorldPosition + offset ).y;',
        'gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );',
        '',
        '}'
      ].join('\n')

      const uniforms = {
        topColor: { value: new Color(0x0077ff) },
        bottomColor: { value: new Color(0xedf5ff) },
        offset: { value: 33 },
        exponent: { value: 0.6 }
      }

      var skyGeo = new SphereBufferGeometry(500, 32, 15)
      var skyMat = new ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        side: BackSide
      })

      var sky = new Mesh(skyGeo, skyMat)
      this.scene.add(sky)
    }

    if (features.includes('camera')) {
      this.camera.position.set(0, 6, 12)
      Features = { camera: this.camera, ...Features }
    }

    if (features.includes('light')) {
      const intensity = 0.4
      const hemisphereLight = this.lights.hemisphereLight({ skyColor: 0xffffff, groundColor: 0x000000, intensity })
      const ambientLight = this.lights.ambientLight({ color: 0xffffff, intensity })
      const directionalLight = this.lights.directionalLight({ color: 0xffffff, intensity })

      directionalLight.position.set(100, 200, 50)
      const d = 20
      directionalLight.shadow.camera.top = d
      directionalLight.shadow.camera.bottom = -d
      directionalLight.shadow.camera.left = -d
      directionalLight.shadow.camera.right = d

      directionalLight.shadow.mapSize.set(1024, 1024)
      // this.directionalLight = light
      const lights = {
        ambientLight,
        directionalLight,
        hemisphereLight
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

      texture.wrapS = texture.wrapT = RepeatWrapping
      texture.repeat.set(21, 21)

      // ground
      const geometry = { name: 'ground', width: 21, height: 21, depth: 1, y: -0.5 }
      const material = {
        phong: { map: addGrid ? texture : null, color: 0xffffff }
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

      const orbitControls = new OrbitControls(
        this.camera,
        document.getElementById('enable3d-phaser-canvas') || this.renderer.domElement
      )
      Features = { orbitControls, ...Features }
    }

    return Features
  }
}
