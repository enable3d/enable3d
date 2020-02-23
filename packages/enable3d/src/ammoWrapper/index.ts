/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import logger from '../helpers/logger'
import PhysicsBody from './physicsBody'
import ThreeGraphics from '../threeWrapper'
import {
  SphereConfig,
  GroundConfig,
  MaterialConfig,
  BoxConfig,
  CylinderConfig,
  ExtrudeConfig,
  Phaser3DConfig,
  AddExistingConfig,
  TorusConfig
} from '../types'
import applyMixins from '../helpers/applyMixins'
import ExtendedObject3D from '../threeWrapper/extendedObject3D'
import Shapes from './shapes'
import Constraints from './constraints'
import { Scene3D } from '..'
import Events from './events'
import EventEmitter from 'eventemitter3'
import Physics from './physics'
import { Vector3, Quaternion } from 'three'
import { createCollisionShapes } from './three-to-ammo'
import { addTorusShape } from './torusShape'

interface AmmoPhysics extends Physics, Constraints, Shapes, Events {}

class AmmoPhysics extends EventEmitter {
  public tmpTrans: Ammo.btTransform
  protected rigidBodies: ExtendedObject3D[] = []
  protected objectsAmmo: { [ptr: number]: any } = {}
  protected earlierDetectedCollisions: { combinedName: string; collision: boolean }[] = []
  protected gravity: { x: number; y: number; z: number }

  constructor(protected phaser3D: ThreeGraphics, protected scene: Scene3D, public config: Phaser3DConfig = {}) {
    super()

    this.emptyV3 = new Vector3()
    this.impactPoint = new Vector3()
    this.impactNormal = new Vector3()

    this.gravity = config.gravity || { x: 0, y: -9.81, z: 0 }

    this.start()
  }

  public get debug() {
    return {
      enable: () => {
        this.debugDrawer.enable()
      },
      mode: (debugMode: number = 1) => {
        this.debugDrawer.setDebugMode(debugMode)
      },
      disable: () => {
        this.debugDrawer.disable()
      }
    }
  }

  private start() {
    if (typeof Ammo === 'undefined') {
      logger('Are you sure you included ammo.js?')
      return
    }

    if (typeof Ammo === 'function')
      Ammo().then(() => {
        this.setup()
      })
    else this.setup()
  }

  public get add() {
    return {
      collider: (
        object1: ExtendedObject3D,
        object2: ExtendedObject3D,
        eventCallback: (event: 'start' | 'collision' | 'end') => void
      ) => this.addCollider(object1, object2, eventCallback),
      constraints: this.addConstraints,
      existing: (object: ExtendedObject3D, config?: AddExistingConfig) => this.addExisting(object, config),
      sphere: (sphereConfig: SphereConfig = {}, materialConfig: MaterialConfig = {}) =>
        this.addSphere(sphereConfig, materialConfig),
      ground: (groundConfig: GroundConfig = {}, materialConfig: MaterialConfig = {}) =>
        this.addGround(groundConfig, materialConfig),
      box: (boxConfig: BoxConfig = {}, materialConfig: MaterialConfig = {}) => this.addBox(boxConfig, materialConfig),
      cylinder: (cylinderConfig: CylinderConfig = {}, materialConfig: MaterialConfig = {}) =>
        this.addCylinder(cylinderConfig, materialConfig),
      torus: (torusConfig: TorusConfig = {}, materialConfig: MaterialConfig = {}) =>
        this.addTorus(torusConfig, materialConfig),
      extrude: (extrudeConfig: ExtrudeConfig, materialConfig: MaterialConfig = {}) =>
        this.addExtrude(extrudeConfig, materialConfig)
    }
  }

  protected addExisting(object: ExtendedObject3D, config: AddExistingConfig = {}): void {
    const { position: pos, quaternion: quat, hasBody } = object
    const { mass = 1, autoCenter = false, offset = undefined, shapes = [], breakable = false } = config

    let params = {
      width: 1,
      height: 1,
      depth: 1,
      radius: 0.5,
      radiusTop: 0.5, // for the cylinder
      tube: 0.4, // for the torus
      tubularSegments: 8 // for the torus
    }
    let shape = 'box'

    if (config.shape) {
      params = { ...params, ...config }
      shape = config.shape
    } else if (object.shape) {
      // @ts-ignore
      params = { ...params, ...object?.geometry?.parameters }
      shape = object.shape
    }

    if (hasBody) {
      logger(`Object "${object.name}" already has a physical body!`)
      return
    }

    // auto adjust the center for custom shapes
    if (autoCenter) object.geometry.center()

    // some aliases
    if (shape === 'extrude') shape = 'hacd'
    if (shape === 'mesh' || shape === 'convex') shape = 'convexMesh'
    if (shape === 'concave') shape = 'concaveMesh'

    let Shape

    // combine multiple shapes to one compound shape
    if (shapes.length > 0) {
      const tmp: any[] = [] // stores all the raw shapes
      const compoundShape = new Ammo.btCompoundShape()

      shapes.forEach(obj => {
        tmp.push(this.addShape({ shape: obj.shape, params: { ...obj } }))
      })

      shapes.forEach((obj, i) => {
        const transform = new Ammo.btTransform()
        // @ts-ignore
        const pos = { x: obj.x || 0, y: obj.y || 0, z: obj.z || 0 }
        transform.setIdentity()
        transform.setOrigin(new Ammo.btVector3(pos.x || 0, pos.y || 0, pos.z || 0))
        // TODO add rotation
        // transform.setRotation(new Ammo.btQuaternion(quat.x || 0, quat.y || 0, quat.z || 0, quat.w || 1))
        compoundShape.addChildShape(transform, tmp[i])
      })

      Shape = compoundShape
    } else {
      Shape = this.addShape({ shape, shapes, params, object, quat })
    }

    if (!Shape) {
      logger(`Could not recognize shape "${shape}"!`)
      return
    }

    Shape.setMargin(0.05)

    this.addRigidBody(object, Shape, mass, pos, quat)
    this.addBodyProperties(object, config)

    if (breakable) object.body.breakable = true
    if (offset) object.body.offset = { x: 0, y: 0, z: 0, ...offset }
  }

  private addShape(opts: any) {
    const { shape, object, params, quat } = opts

    let Shape
    switch (shape) {
      case 'box':
        Shape = new Ammo.btBoxShape(new Ammo.btVector3(params.width / 2, params.height / 2, params.depth / 2))
        break
      case 'sphere':
        Shape = new Ammo.btSphereShape(params.radius)
        break
      case 'cylinder':
        Shape = new Ammo.btCylinderShape(new Ammo.btVector3(params.radiusTop, params.height / 2, 0))
        break
      case 'torus':
        Shape = addTorusShape(params, quat)
        break
      case 'hull':
        Shape = createCollisionShapes(object, { type: 'hull' })
        break
      case 'hacd':
        Shape = createCollisionShapes(object, { type: 'hacd' })
        break
      case 'vhacd':
        Shape = createCollisionShapes(object, { type: 'vhacd' })
        break
      case 'convexMesh':
        Shape = createCollisionShapes(object, { type: 'mesh', concave: false })
        break
      case 'concaveMesh':
        Shape = createCollisionShapes(object, { type: 'mesh', concave: true })
        break
    }

    if (Array.isArray(Shape)) {
      const compoundShape = new Ammo.btCompoundShape()
      Shape.forEach(shape => {
        const transform = new Ammo.btTransform()
        transform.setIdentity()
        compoundShape.addChildShape(transform, shape)
      })
      Shape = compoundShape
    }

    return Shape
  }

  protected createRigidBody(physicsShape: any, mass: number, pos: Vector3, quat: Quaternion) {
    const transform = new Ammo.btTransform()
    transform.setIdentity()
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z))
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w))
    const motionState = new Ammo.btDefaultMotionState(transform)
    const localInertia = new Ammo.btVector3(0, 0, 0)
    if (mass > 0) {
      physicsShape.calculateLocalInertia(mass, localInertia)
    }
    const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, physicsShape, localInertia)
    const rigidBody = new Ammo.btRigidBody(rbInfo)
    return rigidBody
  }

  protected addRigidBody(
    threeObject: ExtendedObject3D,
    physicsShape: any,
    mass: number,
    pos: Vector3,
    quat: Quaternion,
    scale?: { x: number; y: number; z: number }
  ) {
    threeObject.position.copy(pos)
    threeObject.quaternion.copy(quat)

    const rigidBody = this.createRigidBody(physicsShape, mass, pos, quat)

    if (scale) {
      const localScale = new Ammo.btVector3(scale.x, scale.y, scale.z)
      physicsShape.setLocalScaling(localScale)
      Ammo.destroy(localScale)
    }

    if (mass > 0) {
      // Disable deactivation
      rigidBody.setActivationState(4)
    }

    this.rigidBodies.push(threeObject)
    this.physicsWorld.addRigidBody(rigidBody)

    const ptr = Object.values(rigidBody)[0]
    // @ts-ignore
    rigidBody.name = threeObject.name
    threeObject.body = new PhysicsBody(this, rigidBody)
    threeObject.hasBody = true
    // @ts-ignore
    threeObject.ptr = ptr
    this.objectsAmmo[ptr] = threeObject
  }

  protected addBodyProperties(obj: ExtendedObject3D, config: any) {
    const { friction = 0.5, collisionFlags = 0 } = config
    obj.body.setCollisionFlags(collisionFlags)
    obj.body.setFriction(friction)
  }
}

applyMixins(AmmoPhysics, [Physics, Constraints, Shapes, Events])

export default AmmoPhysics
