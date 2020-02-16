/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2019 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import {
  SphereConfig,
  MaterialConfig,
  BoxConfig,
  GroundConfig,
  CylinderConfig,
  ExtendedObject3D,
  ExtrudeConfig,
  TorusConfig,
  AddExistingConfig
} from '../types'
import ThreeGraphics from '../threeWrapper'

interface Shapes {}

class Shapes {
  public tmpTrans: Ammo.btTransform
  public physicsWorld: Ammo.btDiscreteDynamicsWorld
  protected objectsAmmo: { [ptr: number]: any } = {}
  protected addExisting: (object: ExtendedObject3D, config?: AddExistingConfig) => void

  constructor(protected phaser3D: ThreeGraphics) {}

  protected addSphere(sphereConfig: SphereConfig = {}, materialConfig: MaterialConfig = {}) {
    const sphere = this.phaser3D.add.sphere(sphereConfig, materialConfig)
    this.addExisting(sphere, sphereConfig)
    return sphere
  }

  protected addBox(boxConfig: BoxConfig = {}, materialConfig: MaterialConfig = {}) {
    const box = this.phaser3D.add.box(boxConfig, materialConfig)
    this.addExisting(box, boxConfig)
    return box
  }

  protected addGround(groundConfig: GroundConfig, materialConfig: MaterialConfig = {}) {
    const ground = this.phaser3D.add.ground(groundConfig, materialConfig)
    const config = { ...groundConfig, collisionFlags: 1 }
    this.addExisting(ground, config)
    return ground
  }

  protected addCylinder(cylinderConfig: CylinderConfig = {}, materialConfig: MaterialConfig = {}) {
    const cylinder = this.phaser3D.add.cylinder(cylinderConfig, materialConfig)
    this.addExisting(cylinder, cylinderConfig)
    return cylinder
  }

  protected addTorus(torusConfig: TorusConfig = {}, materialConfig: MaterialConfig = {}) {
    const torus = this.phaser3D.add.torus(torusConfig, materialConfig)
    this.addExisting(torus, torusConfig)
    return torus
  }

  protected addExtrude(extrudeConfig: ExtrudeConfig, materialConfig: MaterialConfig = {}) {
    const object = this.phaser3D.add.extrude(extrudeConfig, materialConfig)
    object.translateX(1)
    this.addExisting(object)
    return object
  }
}

export default Shapes
