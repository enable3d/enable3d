/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2019 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import logger from '../helpers/logger'
import PhysicsBody from './physicsBody'
import ThreeWrapper from '../threeWrapper'
import { SphereConfig, GroundConfig, MaterialConfig, BoxConfig } from '../types'
import applyMixins from '../helpers/applyMixins'
import ExtendedObject3D from '../extendedObject3D'
import EventEmitter from 'eventemitter3'
import Constraints from './constraints'
import DebugDrawer from './debugDrawer'

interface AmmoPhysics extends Constraints {}

class AmmoPhysics extends EventEmitter {
  private rigidBodies: ExtendedObject3D[] = []
  public tmpTrans: Ammo.btTransform
  // private physicsWorld: Ammo.btSoftRigidDynamicsWorld
  private dispatcher: Ammo.btCollisionDispatcher
  private objectsAmmo: { [ptr: number]: any } = {}
  private earlierDetectedCollisions: { combinedName: string; collision: boolean }[] = []
  private debugDrawer: DebugDrawer

  constructor(protected phaser3D: ThreeWrapper, private scene: Phaser.Scene) {
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

  private setup() {
    // setup ammo physics
    this.setupPhysicsWorld()

    this.debugDrawer = new DebugDrawer(this.phaser3D.scene, this.physicsWorld, {})

    /**
     * TODO add ghost object
     */
    // const ghost = new Ammo.btGhostObject()
    // ghost.setCollisionShape(new Ammo.btSphereShape(10))
    // ghost.setWorldTransform(new Ammo.btTransform(new Ammo.btQuaternion(0, 0, 0, 1), new Ammo.btVector3(0, 15, 0)))
    // ghost.setCollisionFlags(4)
    // this.physicsWorld.addCollisionObject(ghost)

    // run the phaser update method
    this.scene.events.on('update', (_time: number, delta: number) => {
      this.update(delta / 1000)
      if (this.debugDrawer && this.debugDrawer.enabled) this.debugDrawer.update()
    })
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
      box: (boxConfig: BoxConfig = {}, materialConfig: MaterialConfig = {}) => this.addBox(boxConfig, materialConfig)
    }
  }

  // TODO this is not finished yet
  private addCollider(
    object1: ExtendedObject3D,
    object2: ExtendedObject3D,
    eventCallback: (event: 'start' | 'collision' | 'end') => void
  ) {
    this.on('collision', data => {
      const { bodies, event } = data
      if (bodies[0].name === object1.name && bodies[1].name === object2.name) eventCallback(event)
      else if (bodies[1].name === object1.name && bodies[0].name === object2.name) eventCallback(event)
    })
  }

  private addExisting(object: ExtendedObject3D, config: any = {}): void {
    const { position: pos, quaternion: quat, shape, hasBody } = object
    const { width = 2, height = 2, depth = 2 } = config
    // @ts-ignore
    const params = object?.geometry?.parameters
    const hasShape = object.hasOwnProperty('shape')
    const mass = 1

    const defaultShape = () => new Ammo.btBoxShape(new Ammo.btVector3(width / 2, height / 2, depth / 2))

    if (hasBody) {
      logger(`Object "${object.name}" already has a physical body!`)
      return
    }

    let Shape
    if (hasShape && params) {
      switch (shape) {
        case 'box':
          Shape = new Ammo.btBoxShape(new Ammo.btVector3(params.width, params.height, params.depth))
          break
        case 'sphere':
          Shape = new Ammo.btSphereShape(params.radius)
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

    if (!hasShape) {
      // this will make sure the body will be aligned to the bottom
      object.body.offset = { x: 0, y: -height / 2, z: 0 }
    }
  }

  private setupPhysicsWorld() {
    var gravityConstant = -20

    const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration()
    const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration)
    const broadphase = new Ammo.btDbvtBroadphase()
    const solver = new Ammo.btSequentialImpulseConstraintSolver()
    this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration)
    this.physicsWorld.setGravity(new Ammo.btVector3(0, gravityConstant, 0))

    this.dispatcher = dispatcher
    this.tmpTrans = new Ammo.btTransform()
  }

  private update(deltaTime: number) {
    // Step world
    this.physicsWorld.stepSimulation(deltaTime)

    // Collision
    const detectedCollisions: { combinedName: string; collision: boolean }[] = []
    const num = this.dispatcher.getNumManifolds()
    for (let i = 0; i < num; i++) {
      const manifold = this.dispatcher.getManifoldByIndexInternal(i)
      // gets all contact points (edges)
      const num_contacts = manifold.getNumContacts()
      if (num_contacts === 0) {
        continue
      }

      for (let j = 0; j < num_contacts; j++) {
        // const flag0 = manifold.getBody0().getCollisionFlags()
        // const flag1 = manifold.getBody1().getCollisionFlags()

        // @ts-ignore
        const zs0 = manifold.getBody0().zs
        // @ts-ignore
        const zs1 = manifold.getBody1().zs
        // @ts-ignore
        const obj0 = zs0 in this.objectsAmmo ? this.objectsAmmo[zs0] : manifold.getBody0()
        // @ts-ignore
        const obj1 = zs0 in this.objectsAmmo ? this.objectsAmmo[zs1] : manifold.getBody1()

        // check if a collision between these object has already been processed
        const combinedName = `${obj0.name}__${obj1.name}`
        if (detectedCollisions.find(el => el.combinedName === combinedName)) {
          continue
        }

        let event
        if (this.earlierDetectedCollisions.find(el => el.combinedName === combinedName)) {
          event = 'colliding'
        } else {
          event = 'start'
        }
        detectedCollisions.push({ combinedName, collision: true })

        // const a = manifold.getContactPoint(num_contacts).getPositionWorldOnA()
        // const b = manifold.getContactPoint(num_contacts).getPositionWorldOnB()
        // console.log(a.x(), a.y(), a.z())
        // console.log(b.x(), b.y(), b.z())

        // console.log(pt)
        // console.log(pt.getAppliedImpulse())

        this.emit('collision', { bodies: [obj0, obj1], event })

        // https://stackoverflow.com/questions/31991267/bullet-physicsammo-js-in-asm-js-how-to-get-collision-impact-force
        // console.log('COLLISION DETECTED!')
        // HERE: how to get impact force details?
        // const pt = manifold.getContactPoint(j)
        // pt.getAppliedImpulse() is not working
      }
    }
    // Check which collision ended
    this.earlierDetectedCollisions.forEach(el => {
      const { combinedName } = el
      if (!detectedCollisions.find(el => el.combinedName === combinedName)) {
        const split = combinedName.split('__')
        // console.log(split[0], split[1])
        const obj0 = this.rigidBodies.find(obj => obj.name === split[0])
        const obj1 = this.rigidBodies.find(obj => obj.name === split[1])
        // console.log(obj0, obj1)
        if (obj0 && obj1) this.emit('collision', { bodies: [obj0, obj1], event: 'end' })
      }
    })
    // Update earlierDetectedCollisions
    this.earlierDetectedCollisions = [...detectedCollisions]

    // Update rigid bodies
    for (let i = 0; i < this.rigidBodies.length; i++) {
      let objThree = this.rigidBodies[i]
      // console.log(objThree)
      let objAmmo = objThree.body.ammoBody
      let ms = objAmmo.getMotionState()
      if (ms) {
        ms.getWorldTransform(this.tmpTrans)
        let p = this.tmpTrans.getOrigin()
        let q = this.tmpTrans.getRotation()
        // body offset
        let o = objThree.body.offset
        objThree.position.set(p.x() + o.x, p.y() + o.y, p.z() + o.z)
        objThree.quaternion.set(q.x(), q.y(), q.z(), q.w())
      }
    }
  }

  private addRigidBody = (threeObject: ExtendedObject3D, physicsShape: any, mass: any, pos: any, quat: any) => {
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

    const zs = Object.values(rigidBody)[0]
    // @ts-ignore
    rigidBody.name = threeObject.name
    threeObject.body = new PhysicsBody(this, rigidBody)
    threeObject.hasBody = true
    this.objectsAmmo[zs] = threeObject
  }

  private addBodyProperties(obj: ExtendedObject3D, config: any) {
    const { friction = 0.5, collisionFlag = 0 } = config

    obj.body.ammoBody.setCollisionFlags(collisionFlag)
    obj.body.ammoBody.setFriction(friction)
  }

  private addSphere(sphereConfig: SphereConfig = {}, materialConfig: MaterialConfig = {}) {
    const sphere = this.phaser3D.add.sphere(sphereConfig, materialConfig)

    // @ts-ignore
    const { radius } = sphere.geometry.parameters
    const { position: pos, quaternion: quat } = sphere
    const { mass = 1 } = sphereConfig

    const ballShape = new Ammo.btSphereShape(radius)
    ballShape.setMargin(0.05)

    this.addRigidBody(sphere, ballShape, mass, pos, quat)
    this.addBodyProperties(sphere, sphereConfig)

    return sphere
  }

  private addBox(boxConfig: BoxConfig = {}, materialConfig: MaterialConfig = {}) {
    const box = this.phaser3D.add.box(boxConfig, materialConfig)

    // @ts-ignore
    const { width, height, depth } = box.geometry.parameters
    const { position: pos, quaternion: quat } = box
    const { mass = 1 } = boxConfig

    const boxShape = new Ammo.btBoxShape(new Ammo.btVector3(width / 2, height / 2, depth / 2))
    boxShape.setMargin(0.05)

    this.addRigidBody(box, boxShape, mass, pos, quat)
    this.addBodyProperties(box, boxConfig)

    return box
  }

  private addGround(groundConfig: GroundConfig, materialConfig: MaterialConfig = {}) {
    const ground = this.phaser3D.add.ground(groundConfig, materialConfig)

    // @ts-ignore
    const { width, height, depth } = ground.geometry.parameters
    const { position: pos, quaternion: quat } = ground
    const { mass = 1 } = groundConfig

    const boxShape = new Ammo.btBoxShape(new Ammo.btVector3(width / 2, height / 2, depth / 2))
    boxShape.setMargin(0.05)

    this.addRigidBody(ground, boxShape, mass, pos, quat)
    this.addBodyProperties(ground, groundConfig)

    return ground
  }
}

applyMixins(AmmoPhysics, [Constraints])

export default AmmoPhysics
