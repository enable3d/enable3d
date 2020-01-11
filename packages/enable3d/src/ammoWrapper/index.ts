/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2019 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import logger from '../helpers/logger'
import PhysicsBody from './physicsBody'
import ThreeGraphics from '../threeWrapper'
import { SphereConfig, GroundConfig, MaterialConfig, BoxConfig, CylinderConfig, ExtrudeConfig } from '../types'
import applyMixins from '../helpers/applyMixins'
import ExtendedObject3D from '../threeWrapper/extendedObject3D'
import Shapes from './shapes'
import Constraints from './constraints'
import DebugDrawer from './debugDrawer'
import { Scene3D } from '..'
import Events from './events'
import EventEmitter = require('eventemitter3')
import Physics from './physics'

interface AmmoPhysics extends Physics, Constraints, Shapes, Events {}

class AmmoPhysics extends EventEmitter {
  public tmpTrans: Ammo.btTransform
  protected rigidBodies: ExtendedObject3D[] = []
  protected objectsAmmo: { [ptr: number]: any } = {}
  protected earlierDetectedCollisions: { combinedName: string; collision: boolean }[] = []

  constructor(protected phaser3D: ThreeGraphics, protected scene: Scene3D) {
    super()
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
      existing: (object: ExtendedObject3D, config?: any) => this.addExisting(object, config),
      sphere: (sphereConfig: SphereConfig = {}, materialConfig: MaterialConfig = {}) =>
        this.addSphere(sphereConfig, materialConfig),
      ground: (groundConfig: GroundConfig, materialConfig: MaterialConfig = {}) =>
        this.addGround({ ...groundConfig, mass: 0 }, materialConfig),
      box: (boxConfig: BoxConfig = {}, materialConfig: MaterialConfig = {}) => this.addBox(boxConfig, materialConfig),
      cylinder: (cylinderConfig: CylinderConfig = {}, materialConfig: MaterialConfig = {}) =>
        this.addCylinder(cylinderConfig, materialConfig),
      extrude: (extrudeConfig: ExtrudeConfig, materialConfig: MaterialConfig = {}) =>
        this.addExtrude(extrudeConfig, materialConfig)
    }
  }

  private addExisting(object: ExtendedObject3D, config: any = {}): void {
    const { position: pos, quaternion: quat, shape, hasBody } = object
    const { width = 1, height = 1, depth = 1, autoCenter = true, offset = undefined } = config
    // @ts-ignore
    const params = object?.geometry?.parameters
    const hasShape = object.hasOwnProperty('shape')
    const mass = 1

    const defaultShape = () => new Ammo.btBoxShape(new Ammo.btVector3(width / 2, height / 2, depth / 2))

    if (hasBody) {
      logger(`Object "${object.name}" already has a physical body!`)
      return
    }

    // auto adjust the center for custom shapes
    if (autoCenter && (shape === 'convex' || shape === 'concave')) object.geometry.center()

    let Shape
    if (hasShape) {
      switch (shape) {
        case 'box':
          Shape = new Ammo.btBoxShape(new Ammo.btVector3(params.width, params.height, params.depth))
          break
        case 'sphere':
          Shape = new Ammo.btSphereShape(params.radius)
          break
        case 'convex':
          Shape = this.addTriMeshShape(object, config)
          break
        case 'concave':
          Shape = this.addTriMeshShape(object, config)
          break
        default:
          Shape = defaultShape()
          break
      }
    } else {
      Shape = defaultShape()
    }

    Shape.setMargin(0.05)

    this.addRigidBody(object, Shape, mass, pos, quat)
    this.addBodyProperties(object, config)

    if (!hasShape) {
      const defaultOffset = { x: 0, y: 0, z: 0 }
      if (offset) object.body.offset = { ...defaultOffset, ...offset }
      // this will make sure the body will be aligned to the bottom
      else object.body.offset = { ...defaultOffset, y: -height / 2 }
    }
  }

  protected addRigidBody = (threeObject: ExtendedObject3D, physicsShape: any, mass: any, pos: any, quat: any) => {
    threeObject.position.copy(pos)
    threeObject.quaternion.copy(quat)
    var transform = new Ammo.btTransform()
    transform.setIdentity()
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z))
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w))
    var motionState = new Ammo.btDefaultMotionState(transform)
    var localInertia = new Ammo.btVector3(0, 0, 0)
    physicsShape.calculateLocalInertia(mass, localInertia)
    var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, physicsShape, localInertia)
    var rigidBody = new Ammo.btRigidBody(rbInfo)

    // TODO: rigidBody offset will not be applied if the
    // object will not be updated in update()
    if (mass > 0) {
      // @ts-ignore
      // this.rigidBodies.push(threeObject)
      // Disable deactivation
      rigidBody.setActivationState(4)
    }
    // @ts-ignore
    this.rigidBodies.push(threeObject)

    this.physicsWorld.addRigidBody(rigidBody)

    const ptr = Object.values(rigidBody)[0]
    // @ts-ignore
    rigidBody.name = threeObject.name
    threeObject.body = new PhysicsBody(this, rigidBody)
    threeObject.hasBody = true
    this.objectsAmmo[ptr] = threeObject
  }
}

applyMixins(AmmoPhysics, [Physics, Constraints, Shapes, Events])

export default AmmoPhysics
