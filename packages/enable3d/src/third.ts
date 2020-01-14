/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2019 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import ThreeGraphics from './threeWrapper'
import AmmoPhysics from './ammoWrapper'
import { Phaser3DConfig } from './types'
import { Vector2, Vector3, RepeatWrapping, Shape, Geometry, BufferGeometry } from 'three'
import ExtendedObject3D from './threeWrapper/extendedObject3D'
import logger from './helpers/logger'
import { Scene3D } from '.'

type WarpedStartFeatures =
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

class Third extends ThreeGraphics {
  public ground: ExtendedObject3D
  public physics: AmmoPhysics

  /**
   * Start Phaser3D
   * @param scene Add the current Phaser Scene
   * @param config Phaser3D Config
   */
  constructor(scene: Scene3D, config: Phaser3DConfig) {
    super(scene, config)

    if (window.__loadPhysics) this.physics = new AmmoPhysics(this, scene)

    // remove the update event which is used by ThreeGraphics.ts and AmmoPhysics.ts
    scene.events.once('shutdown', () => {
      scene.events.removeListener('update')
    })
  }

  // Todo: Add something awesome here
  public haveSomeFun(numberOfElements: number = 20) {
    if (!window.__loadPhysics) {
      logger('There is not much fun without physics enabled!')
      return
    }

    // adding some boxes (with physics)
    for (let i = 0; i < numberOfElements; i++) {
      let materials = ['standard', 'basic', 'normal', 'phong', 'line', 'points']
      if (Math.random() > 0.5) {
        this.physics.add
          .box(
            {
              x: Phaser.Math.Between(-20, 20),
              y: Phaser.Math.Between(20, 40),
              z: Phaser.Math.Between(-20, 20),
              width: Phaser.Math.Between(1, 2),
              height: Phaser.Math.Between(1, 2),
              depth: Phaser.Math.Between(1, 2),
              mass: 1
            },
            { [Phaser.Math.RND.pick(materials)]: { color: Math.floor(Math.random() * 0xffffff) } }
          )
          .body.setRestitution(Math.floor(Math.random() * 10) / 10)
      } else {
        this.physics.add
          .sphere(
            {
              x: Phaser.Math.Between(-20, 20),
              y: Phaser.Math.Between(20, 40),
              z: Phaser.Math.Between(-20, 20),
              radius: Phaser.Math.Between(1, 2),
              mass: 1
            },
            { [Phaser.Math.RND.pick(materials)]: { color: Math.floor(Math.random() * 0xffffff) } }
          )
          .body.setRestitution(Math.floor(Math.random() * 10) / 10)
      }
    }
  }

  /**
   * It takes took long to setup the third dimension your self? Get started with warp speed by using this function.
   * @param features Pass the features you want to setup.
   */
  warpSpeed(...features: WarpedStartFeatures[]) {
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
      this.scene.background = this.new.color(0xbfd1e5)
    }

    if (features.includes('camera')) {
      this.camera.position.set(25, 25, 50)
    }

    if (features.includes('light')) {
      this.add.ambientLight({ color: 0x707070 })
      const light = this.add.directionalLight({ skyColor: 0xffffff, intensity: 0.8, x: -10, y: 18, z: 5 })
      const d = 50
      light.shadow.camera.top = d
      light.shadow.camera.bottom = -d
      light.shadow.camera.left = -d
      light.shadow.camera.right = d

      light.shadow.mapSize.set(1024, 1024)
    }

    if (features.includes('lookAtCenter')) {
      this.camera.lookAt(this.scene.position)
    }

    if (features.includes('ground')) {
      // grid (texture)
      const addGrid = features.includes('grid')
      const gridData =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOnAAADusBZ+q87AAAAJtJREFUeJzt0EENwDAAxLDbNP6UOxh+NEYQ5dl2drFv286598GrA7QG6ACtATpAa4AO0BqgA7QG6ACtATpAa4AO0BqgA7QG6ACtATpAa4AO0BqgA7QG6ACtATpAa4AO0BqgA7QG6ACtATpAa4AO0BqgA7QG6ACtATpAa4AO0BqgA7QG6ACtATpAa4AO0BqgA7QG6ACtATpAu37AD8eaBH5JQdVbAAAAAElFTkSuQmCC'
      const texture = this.load.texture(gridData)
      texture.wrapS = texture.wrapT = RepeatWrapping
      texture.repeat.set(25, 25)

      // ground
      this.ground = this.physics.add.ground(
        {
          name: 'ground',
          width: 50,
          height: 50,
          depth: 1,
          y: -0.5
        },
        { phong: { map: addGrid ? texture : null, transparent: true, opacity: 0.8, color: 0xffffff } }
      )
      this.ground.receiveShadow = true
      this.ground.body.setRestitution(1)
    }

    if (features.includes('orbitControls')) {
      Third.OrbitControls(this.camera, this.root.scale.parent)
    }
  }

  /**
   * Add OrbitControls to your scene
   * @param camera Pass the current camera (this.three.camera)
   * @param parent Pass the parent object of the Canvas (this.scale.parent)
   */
  static OrbitControls(camera: any, parent: any) {
    return ThreeGraphics.OrbitControls(camera, parent)
  }

  public get on() {
    return {
      /**
       * This returns all collisions of all object. Maybe you are looking for 'this.third.physics.add.collider(body1, body2, callback)' instead?
       */
      collision: (
        eventCallback: (data: { bodies: ExtendedObject3D[]; event: 'start' | 'collision' | 'end' }) => void
      ) => {
        this.physics.on('collision', (data: { bodies: ExtendedObject3D[]; event: 'start' | 'collision' | 'end' }) => {
          eventCallback(data)
        })
      }
    }
  }

  /**
   * Get the PixelPerSquare to be able to add to place 3D elements on a 2D surface.
   * The camera must have no rotation!
   * The camera must have no transformation on the x and y axis!
   * @param z The Z value of the THREE Camera you want to get the PixelPerSquare (PPS) from.
   */
  getPixelsPerSquare(z: number = 0): number {
    let center = this.transform.from3dto2d(new Vector3(0, 0, z))
    let right = this.transform.from3dto2d(new Vector3(1, 0, z))
    return Math.abs(center.x - right.x)
  }

  get transform() {
    return {
      geometryToBufferGeometry: (geometry: Geometry | BufferGeometry) => {
        // @ts-ignore
        if (geometry.isGeometry) return new BufferGeometry().fromGeometry(geometry)
        else return geometry as BufferGeometry
      },
      bufferGeometryToGeometry: (bufferGeometry: Geometry | BufferGeometry) => {
        // @ts-ignore
        if (bufferGeometry.isBufferGeometry) return new Geometry().fromBufferGeometry(bufferGeometry)
        else return bufferGeometry as Geometry
      },
      fromSVGtoShape: (key: string, isCCW?: boolean, noHoles?: boolean) =>
        this.transformFromSVGtoShape(key, isCCW, noHoles),
      from3dto2d: (position: Vector3) => this.transformFrom3dto2d(position),
      from2dto3d: (x: number, y: number, z: number = 0) => this.transformFrom2dto3d(x, y, z)
    }
  }

  /**
   * Transforms your svg files to paths. First load your svg files using 'this.load.html(path_to_file)' in preload().
   */
  private transformFromSVGtoShape(key: string, isCCW: boolean = false, noHoles?: boolean) {
    const svg = this.root.cache.html.get(key)
    if (svg) {
      const svgLoader = this.new.svgLoader()
      const shapes: Shape[] = []
      svgLoader.parse(svg).paths.forEach(path => {
        path.toShapes(isCCW, noHoles).forEach(shape => {
          shapes.push(shape)
        })
      })
      return shapes
    }
    return []
  }

  private transformFrom3dto2d(position: Vector3): Vector2 {
    const vector3 = new Vector3(position.x, position.y, position.z)
    const canvas = this.renderer.domElement

    // map to normalized device coordinate (NDC) space
    this.camera.updateMatrixWorld()
    vector3.project(this.camera)

    // map to 2D screen space
    const x = Math.round((vector3.x + 1) * (canvas.width / 2))
    const y = Math.round((-vector3.y + 1) * (canvas.height / 2))
    return new Vector2(x, y)
  }

  /**
   *
   * @param x X Position in Phaser Pixels.
   * @param y Y Position in Phaser Pixels.
   * @param z Z-Index of THREE Camera.
   */
  private transformFrom2dto3d(x: number, y: number, z: number = 0): Vector3 {
    const pps = this.getPixelsPerSquare(z)
    const canvas = this.renderer.domElement

    const centerX = canvas.width / 2 / pps
    const centerY = canvas.height / 2 / pps

    return new Vector3(-(centerX - x / pps), centerY - y / pps, z)
  }
}

export default Third
