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
}

export default Third
