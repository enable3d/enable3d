/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { ExtendedObject3D } from '@enable3d/common/dist/types'
import { Scene } from '@enable3d/three-wrapper/dist'
import { AmmoPhysics } from './physics'

// https://github.com/kripken/ammo.js/blob/master/examples/webgl_demo_vehicle/index.html
export class Vehicle {
  vehicle: Ammo.btRaycastVehicle
  tuning: Ammo.btVehicleTuning

  wheelMeshes: ExtendedObject3D[] = []

  engineForce = 0
  vehicleSteering = 0
  breakingForce = 0

  constructor(
    private scene: Scene,
    public physics: AmmoPhysics,
    public chassis: ExtendedObject3D,
    private wheelMesh: ExtendedObject3D
  ) {
    const { physicsWorld } = physics

    this.tuning = new Ammo.btVehicleTuning()
    const rayCaster = new Ammo.btDefaultVehicleRaycaster(physicsWorld)
    this.vehicle = new Ammo.btRaycastVehicle(this.tuning, chassis.body.ammo, rayCaster)

    // do not automatically sync the mesh to the physics body
    chassis.body.skipUpdate = true

    this.vehicle.setCoordinateSystem(0, 1, 2)
    physicsWorld.addAction(this.vehicle)

    const FRONT_LEFT = 0
    const FRONT_RIGHT = 1
    const BACK_LEFT = 2
    const BACK_RIGHT = 3

    const wheelAxisPositionBack = -1
    const wheelRadiusBack = 0.4
    const wheelHalfTrackBack = 0.9
    const wheelAxisHeightBack = 0.3

    const wheelAxisFrontPosition = 1
    const wheelRadiusFront = 0.4
    const wheelHalfTrackFront = 0.9
    const wheelAxisHeightFront = 0.3

    this.addWheel(
      true,
      new Ammo.btVector3(wheelHalfTrackFront, wheelAxisHeightFront, wheelAxisFrontPosition),
      wheelRadiusFront,
      FRONT_LEFT
    )
    this.addWheel(
      true,
      new Ammo.btVector3(-wheelHalfTrackFront, wheelAxisHeightFront, wheelAxisFrontPosition),
      wheelRadiusFront,
      FRONT_RIGHT
    )
    this.addWheel(
      false,
      new Ammo.btVector3(-wheelHalfTrackBack, wheelAxisHeightBack, wheelAxisPositionBack),
      wheelRadiusBack,
      BACK_LEFT
    )
    this.addWheel(
      false,
      new Ammo.btVector3(wheelHalfTrackBack, wheelAxisHeightBack, wheelAxisPositionBack),
      wheelRadiusBack,
      BACK_RIGHT
    )
  }

  update() {
    let tm, p, q, i
    const n = this.vehicle.getNumWheels()
    for (i = 0; i < n; i++) {
      // this.vehicle.updateWheelTransform(i, true)
      tm = this.vehicle.getWheelTransformWS(i)
      p = tm.getOrigin()
      q = tm.getRotation()
      this.wheelMeshes[i].position.set(p.x(), p.y(), p.z())
      this.wheelMeshes[i].quaternion.set(q.x(), q.y(), q.z(), q.w())
      this.wheelMeshes[i].rotateZ(Math.PI / 2)
    }

    tm = this.vehicle.getChassisWorldTransform()
    p = tm.getOrigin()
    q = tm.getRotation()

    this.chassis.position.set(p.x(), p.y(), p.z())
    this.chassis.quaternion.set(q.x(), q.y(), q.z(), q.w())
  }

  addWheel(isFront: any, pos: any, radius: number, index: number) {
    const friction = 1000
    const suspensionStiffness = 20.0
    const suspensionDamping = 2.3
    const suspensionCompression = 4.4
    const suspensionRestLength = 0.6
    const rollInfluence = 0.2

    const wheelDirectionCS0 = new Ammo.btVector3(0, -1, 0)
    const wheelAxleCS = new Ammo.btVector3(-1, 0, 0)

    const wheelInfo = this.vehicle.addWheel(
      pos,
      wheelDirectionCS0,
      wheelAxleCS,
      suspensionRestLength,
      radius,
      this.tuning,
      isFront
    )

    wheelInfo.set_m_suspensionStiffness(suspensionStiffness)
    wheelInfo.set_m_wheelsDampingRelaxation(suspensionDamping)
    wheelInfo.set_m_wheelsDampingCompression(suspensionCompression)
    wheelInfo.set_m_frictionSlip(friction)
    wheelInfo.set_m_rollInfluence(rollInfluence)

    this.wheelMeshes[index] = this.wheelMesh.clone(true)
    this.scene.add(this.wheelMeshes[index])
  }
}
