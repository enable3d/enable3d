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

interface AmmoPhysics extends Constraints {}

class AmmoPhysics extends EventEmitter {
  private rigidBodies: ExtendedObject3D[] = []
  public tmpTrans: Ammo.btTransform
  // private physicsWorld: Ammo.btSoftRigidDynamicsWorld
  private dispatcher: Ammo.btCollisionDispatcher
  private objectsAmmo: { [ptr: number]: any } = {}
  private earlierDetectedCollisions: { combinedName: string; collision: boolean }[] = []

  constructor(private phaser3D: ThreeWrapper, private scene: Phaser.Scene) {
    super()
    this.start()
  }

  // https://github.com/donmccurdy/aframe-physics-system/blob/master/AmmoDriver.md#ammo-constraint
  // https://github.com/donmccurdy/aframe-physics-system/blob/master/src/components/ammo-constraint.js
  public constraintTest(object: ExtendedObject3D, targetObject: ExtendedObject3D) {
    const body = object.body.ammoBody
    const targetBody = targetObject.body.ammoBody

    const bodyTransform = body
      .getCenterOfMassTransform()
      .inverse()
      .op_mul(targetBody.getWorldTransform())
    const targetTransform = new Ammo.btTransform()
    targetTransform.setIdentity()

    // LOCK
    const constraint = new Ammo.btGeneric6DofConstraint(body, targetBody, bodyTransform, targetTransform, true)
    const zero = new Ammo.btVector3(0, 0, 0)
    constraint.setLinearLowerLimit(zero)
    constraint.setLinearUpperLimit(zero)
    constraint.setAngularLowerLimit(zero)
    constraint.setAngularUpperLimit(zero)
    Ammo.destroy(zero)

    // FIXED
    // bodyTransform.setRotation(body.getWorldTransform().getRotation())
    // targetTransform.setRotation(targetBody.getWorldTransform().getRotation())
    // const constraint = new Ammo.btFixedConstraint(body, targetBody, bodyTransform, targetTransform)

    this.physicsWorld.addConstraint(constraint)
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

    const collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration()
    const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration)
    const broadphase = new Ammo.btDbvtBroadphase()
    const solver = new Ammo.btSequentialImpulseConstraintSolver()
    const softBodySolver = new Ammo.btDefaultSoftBodySolver()

    this.dispatcher = dispatcher

    this.physicsWorld = new Ammo.btSoftRigidDynamicsWorld(
      dispatcher,
      broadphase,
      solver,
      collisionConfiguration,
      softBodySolver
    )
    this.physicsWorld.setGravity(new Ammo.btVector3(0, gravityConstant, 0))
    this.physicsWorld.getWorldInfo().set_m_gravity(new Ammo.btVector3(0, gravityConstant, 0))

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
        const Xx0 = manifold.getBody0().Xx
        // @ts-ignore
        const Xx1 = manifold.getBody1().Xx
        // @ts-ignore
        const obj0 = Xx0 in this.objectsAmmo ? this.objectsAmmo[Xx0] : manifold.getBody0()
        // @ts-ignore
        const obj1 = Xx0 in this.objectsAmmo ? this.objectsAmmo[Xx1] : manifold.getBody1()

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
    // @ts-ignore
    const Xx = rigidBody.Xx
    // @ts-ignore
    rigidBody.name = threeObject.name
    threeObject.body = new PhysicsBody(this, rigidBody)
    threeObject.hasBody = true
    this.objectsAmmo[Xx] = threeObject
  }

  private addSphere(sphereConfig: SphereConfig = {}, materialConfig: MaterialConfig = {}) {
    const sphere = this.phaser3D.add.sphere(sphereConfig, materialConfig)
    const { position: pos, quaternion: quat, geometry } = sphere
    // @ts-ignore
    const { radius } = geometry.parameters
    const mass = 1

    const ballShape = new Ammo.btSphereShape(radius)
    ballShape.setMargin(0.05)

    this.addRigidBody(sphere, ballShape, mass, pos, quat)

    return sphere
  }

  private addBox(boxConfig: BoxConfig = {}, materialConfig: MaterialConfig = {}) {
    const box = this.phaser3D.add.box(boxConfig, materialConfig)
    // let debug = this.phaser3D.add.box(boxConfig, { line: { color: 0x000000 } })

    // @ts-ignore
    const { width, height, depth } = box.geometry.parameters
    const { position: pos, quaternion: quat } = box
    const { mass = 1, collisionFlag = 0 } = boxConfig

    const boxShape = new Ammo.btBoxShape(new Ammo.btVector3(width / 2, height / 2, depth / 2))
    // console.log('boxShape', boxShape.getLocalScaling())
    boxShape.setMargin(0.05)

    this.addRigidBody(box, boxShape, mass, pos, quat)
    box.body.ammoBody.setCollisionFlags(collisionFlag)
    // body.setFriction( 0.5 );
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
    // body.setFriction( 0.5 );

    return ground
  }
}

applyMixins(AmmoPhysics, [Constraints])

export default AmmoPhysics
