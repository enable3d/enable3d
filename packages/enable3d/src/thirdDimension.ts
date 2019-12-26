/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2019 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import ThreeWrapper from './threeWrapper'
import AmmoPhysics from './ammoWrapper/ammoPhysics'
import { Phaser3DConfig } from './types'
import { Vector2, Vector3 } from 'three'
import ExtendedObject3D from './extendedObject3D'
import logger from './helpers/logger'

type WarpedStartFeatures = 'light' | 'lookAt' | 'ground' | 'orbitControls' | 'fog'

class ThirdDimension extends ThreeWrapper {
  ground: ExtendedObject3D
  public physics: AmmoPhysics

  /**
   * Start Phaser3D
   * @param scene Add the current Phaser Scene
   * @param config Phaser3D Config
   */
  constructor(scene: Phaser.Scene, config: Phaser3DConfig) {
    super(scene, config)

    if (window.__loadPhysics) this.physics = new AmmoPhysics(this, scene)

    // remove the update event which is used by ThreeWrapper.ts and AmmoPhysics.ts
    scene.events.once('shutdown', () => {
      scene.events.removeListener('update')
    })
  }

  // Todo: Add something awesome here
  public haveSomeFun() {
    if (!window.__loadPhysics) {
      logger('There is not much fun without physics enabled!')
      return
    }

    // adding some boxes (with physics)
    for (let i = 0; i < 20; i++) {
      let materials = ['standard', 'basic', 'normal', 'phong', 'line', 'points']
      this.physics.add
        .box(
          {
            x: Phaser.Math.Between(-20, 20),
            y: Phaser.Math.Between(5, 20),
            z: Phaser.Math.Between(-20, 20),
            width: Phaser.Math.Between(1, 2),
            height: Phaser.Math.Between(1, 2),
            depth: Phaser.Math.Between(1, 2),
            mass: 1
          },
          { [Phaser.Math.RND.pick(materials)]: { color: Math.floor(Math.random() * 0xffffff) } }
        )
        .body.setRestitution(Math.floor(Math.random() * 10) / 10)
      this.physics.add
        .sphere(
          {
            x: Phaser.Math.Between(-20, 20),
            y: Phaser.Math.Between(5, 20),
            z: Phaser.Math.Between(-20, 20),
            radius: Phaser.Math.Between(1, 2),
            mass: 1
          },
          { [Phaser.Math.RND.pick(materials)]: { color: Math.floor(Math.random() * 0xffffff) } }
        )
        .body.setRestitution(Math.floor(Math.random() * 10) / 10)
    }
  }

  /**
   * It takes took long to setup the third dimension your self? Get started with warp speed by using this function.
   * @param features Pass the features you want to setup: "light", "lookAt", "ground", "orbitControls", "fog"
   */
  warpSpeed(...features: WarpedStartFeatures[]) {
    if (features.length === 0) features = ['light', 'lookAt', 'ground', 'orbitControls', 'fog']

    if (features.includes('light')) {
      this.add.hemisphereLight({ skyColor: 0xddeeff, groundColor: 0x808080, intensity: 1 })
      this.add.directionalLight({ intensity: 1, x: 100, y: 100, z: 100 })
    }

    if (features.includes('lookAt')) {
      this.camera.lookAt(this.scene.position)
    }

    if (features.includes('ground')) {
      // ground
      this.ground = this.physics.add.ground({
        name: 'ground',
        width: 50,
        height: 50,
        depth: 1,
        y: 0
      })
      // @ts-ignore
      this.ground.body.setRestitution(1)
    }

    if (features.includes('orbitControls')) {
      ThreeWrapper.OrbitControls(this.camera, this.root.scale.parent)
    }
  }

  public get on() {
    return {
      collision: (cb: any) => {
        this.physics.on('collision', bodies => {
          cb(bodies[0], bodies[1])
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
      from3dto2d: (position: Vector3) => this.transformFrom3dto2d(position),
      from2dto3d: (x: number, y: number, z: number = 0) => this.transformFrom2dto3d(x, y, z)
    }
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

export default ThirdDimension
