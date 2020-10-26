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
    chassis: ExtendedObject3D,
    private wheelMesh: ExtendedObject3D
  ) {
    const { physicsWorld } = physics

    this.tuning = new Ammo.btVehicleTuning()
    const rayCaster = new Ammo.btDefaultVehicleRaycaster(physicsWorld)
    this.vehicle = new Ammo.btRaycastVehicle(this.tuning, chassis.body.ammo, rayCaster)

    this.vehicle.setCoordinateSystem(0, 1, 2)
    physicsWorld.addAction(this.vehicle)

    var FRONT_LEFT = 0
    var FRONT_RIGHT = 1
    var BACK_LEFT = 2
    var BACK_RIGHT = 3

    var wheelAxisPositionBack = -1
    var wheelRadiusBack = 0.4
    // var wheelWidthBack = 0.3
    var wheelHalfTrackBack = 1
    var wheelAxisHeightBack = 0.3

    var wheelAxisFrontPosition = 1.7
    var wheelHalfTrackFront = 1
    var wheelAxisHeightFront = 0.3
    var wheelRadiusFront = 0.35
    // var wheelWidthFront = 0.2

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

    var engineForce = 50

    this.vehicle.applyEngineForce(engineForce, BACK_LEFT)
    this.vehicle.applyEngineForce(engineForce, BACK_RIGHT)

    this.vehicle.setSteeringValue(0.5, FRONT_LEFT)
    this.vehicle.setSteeringValue(0.5, FRONT_RIGHT)

    let bla = 0.5
    let dir = -0.01

    setInterval(() => {
      bla += dir
      if (bla < -0.5) dir *= -1
      if (bla > 0.5) dir *= -1
      this.vehicle.setSteeringValue(bla, FRONT_LEFT)
      this.vehicle.setSteeringValue(bla, FRONT_RIGHT)
    }, 100)
  }

  update() {
    var tm, p, q, i
    var n = this.vehicle.getNumWheels()
    for (i = 0; i < n; i++) {
      this.vehicle.updateWheelTransform(i, true)
      tm = this.vehicle.getWheelTransformWS(i)
      p = tm.getOrigin()
      q = tm.getRotation()
      this.wheelMeshes[i].position.set(p.x(), p.y(), p.z())
      this.wheelMeshes[i].quaternion.set(q.x(), q.y(), q.z(), q.w())
      this.wheelMeshes[i].rotateZ(Math.PI / 2)
    }

    // tm = this.vehicle.getChassisWorldTransform()
    // p = tm.getOrigin()
    // q = tm.getRotation()

    // this.chassisMesh.position.set(p.x(), p.y(), p.z())
    // this.chassisMesh.quaternion.set(q.x(), q.y(), q.z(), q.w())
  }

  addWheel(isFront: any, pos: any, radius: number, index: number) {
    var friction = 1000
    var suspensionStiffness = 20.0
    var suspensionDamping = 2.3
    var suspensionCompression = 4.4
    var suspensionRestLength = 0.6
    var rollInfluence = 0.2

    var wheelDirectionCS0 = new Ammo.btVector3(0, -1, 0)
    var wheelAxleCS = new Ammo.btVector3(-1, 0, 0)

    var wheelInfo = this.vehicle.addWheel(
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
