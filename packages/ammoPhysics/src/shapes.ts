/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
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
  AddExistingConfig,
  PlaneConfig,
  ConeConfig
} from '@enable3d/common/dist/types'
import Factories from '@enable3d/common/dist/factories'

interface Shapes {}

class Shapes {
  public tmpTrans: Ammo.btTransform
  public physicsWorld: Ammo.btDiscreteDynamicsWorld
  protected objectsAmmo: { [ptr: number]: any } = {}
  protected addExisting: (object: ExtendedObject3D, config?: AddExistingConfig) => void
  protected factory: Factories

  protected addPlane(planeConfig: PlaneConfig = {}, materialConfig: MaterialConfig = {}) {
    const plane = this.factory.add.plane(planeConfig, materialConfig)
    this.addExisting(plane, planeConfig)
    return plane
  }

  protected addSphere(sphereConfig: SphereConfig = {}, materialConfig: MaterialConfig = {}) {
    const sphere = this.factory.add.sphere(sphereConfig, materialConfig)
    this.addExisting(sphere, sphereConfig)
    return sphere
  }

  protected addBox(boxConfig: BoxConfig = {}, materialConfig: MaterialConfig = {}) {
    const box = this.factory.add.box(boxConfig, materialConfig)
    this.addExisting(box, boxConfig)
    return box
  }

  protected addGround(groundConfig: GroundConfig, materialConfig: MaterialConfig = {}) {
    const ground = this.factory.add.ground(groundConfig, materialConfig)
    const config = { ...groundConfig, mass: 0, collisionFlags: 1 }
    this.addExisting(ground, config)
    return ground
  }

  protected addCylinder(cylinderConfig: CylinderConfig = {}, materialConfig: MaterialConfig = {}) {
    const cylinder = this.factory.add.cylinder(cylinderConfig, materialConfig)
    this.addExisting(cylinder, cylinderConfig)
    return cylinder
  }

  protected addCone(coneConfig: ConeConfig = {}, materialConfig: MaterialConfig = {}) {
    const cone = this.factory.add.cone(coneConfig, materialConfig)
    this.addExisting(cone, coneConfig)
    return cone
  }

  protected addTorus(torusConfig: TorusConfig = {}, materialConfig: MaterialConfig = {}) {
    const torus = this.factory.add.torus(torusConfig, materialConfig)
    this.addExisting(torus, torusConfig)
    return torus
  }

  protected addExtrude(extrudeConfig: ExtrudeConfig, materialConfig: MaterialConfig = {}) {
    const object = this.factory.add.extrude(extrudeConfig, materialConfig)
    object.translateX(1)
    this.addExisting(object)
    return object
  }
}

export default Shapes
