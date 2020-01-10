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
import EventEmitter from 'eventemitter3'
import Constraints from './constraints'
import DebugDrawer from './debugDrawer'
import { Vector3, Matrix4, BufferGeometry } from 'three'
import { Scene3D } from '..'

interface AmmoPhysics extends Constraints {}

class AmmoPhysics extends EventEmitter {
  private rigidBodies: ExtendedObject3D[] = []
  public tmpTrans: Ammo.btTransform
  // private physicsWorld: Ammo.btSoftRigidDynamicsWorld
  private dispatcher: Ammo.btCollisionDispatcher
  private objectsAmmo: { [ptr: number]: any } = {}
  private earlierDetectedCollisions: { combinedName: string; collision: boolean }[] = []
  private debugDrawer: DebugDrawer

  constructor(protected phaser3D: ThreeGraphics, private scene: Scene3D) {
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
    if (!this.phaser3D.isXrEnabled)
      this.scene.events.on('update', (_time: number, delta: number) => {
        this.update(delta)
        this.updateDebugger()
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
      box: (boxConfig: BoxConfig = {}, materialConfig: MaterialConfig = {}) => this.addBox(boxConfig, materialConfig),
      cylinder: (cylinderConfig: CylinderConfig = {}, materialConfig: MaterialConfig = {}) =>
        this.addCylinder(cylinderConfig, materialConfig),
      extrude: (extrudeConfig: ExtrudeConfig, materialConfig: MaterialConfig = {}) =>
        this.addExtrude(extrudeConfig, materialConfig)
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
      if (bodies[0]?.name && bodies[1]?.name && object1?.name && object2?.name) {
        if (bodies[0].name === object1.name && bodies[1].name === object2.name) eventCallback(event)
        else if (bodies[1].name === object1.name && bodies[0].name === object2.name) eventCallback(event)
      }
    })
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

  public updateDebugger() {
    if (this.debugDrawer && this.debugDrawer.enabled) this.debugDrawer.update()
  }

  public update(delta: number) {
    const deltaTime = delta / 1000

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
        const key = Object.keys(manifold.getBody0())[0]

        // @ts-ignore
        const ptr0 = manifold.getBody0()[key]
        // @ts-ignore
        const ptr1 = manifold.getBody1()[key]
        // @ts-ignore
        const obj0 = ptr0 in this.objectsAmmo ? this.objectsAmmo[ptr0] : manifold.getBody0()
        // @ts-ignore
        const obj1 = ptr0 in this.objectsAmmo ? this.objectsAmmo[ptr1] : manifold.getBody1()

        // check if a collision between these object has already been processed
        const combinedName = `${obj0.name}__${obj1.name}`

        // console.log(combinedName)
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
      let objAmmo = objThree.body.ammo
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

    const ptr = Object.values(rigidBody)[0]
    // @ts-ignore
    rigidBody.name = threeObject.name
    threeObject.body = new PhysicsBody(this, rigidBody)
    threeObject.hasBody = true
    this.objectsAmmo[ptr] = threeObject
  }

  // originally copied from https://github.com/InfiniteLee/three-to-ammo
  private iterateGeometries(root: any, options = {}, cb: any) {
    const transform = new Matrix4()
    const inverse = new Matrix4()
    const bufferGeometry = new BufferGeometry()

    inverse.getInverse(root.matrixWorld)
    root.traverse((mesh: any) => {
      if (
        mesh.isMesh &&
        // @ts-ignore
        (options.includeInvisible || (mesh.el && mesh.el.object3D.visible) || mesh.visible)
      ) {
        if (mesh === root) {
          transform.identity()
        } else {
          // @ts-ignore
          if (hasUpdateMatricesFunction) mesh.updateMatrices()
          transform.multiplyMatrices(inverse, mesh.matrixWorld)
        }
        // todo: might want to return null xform if this is the root so that callers can avoid multiplying
        // things by the identity matrix
        cb(mesh.geometry.isBufferGeometry ? mesh.geometry : bufferGeometry.fromGeometry(mesh.geometry), transform)
      }
    })
    // }
  }

  /** Add a custom convex or concave shape. (Concave shapes can only be static) */
  // originally copied from https://github.com/InfiniteLee/three-to-ammo
  private addTriMeshShape(mesh: ExtendedObject3D, meshConfig: any = {}) {
    const va = new Vector3()
    const vb = new Vector3()
    const vc = new Vector3()

    meshConfig.type = 'mesh'
    const shape = mesh.shape || 'convex' //  or 'concave'
    const { scale } = mesh

    const bta = new Ammo.btVector3()
    const btb = new Ammo.btVector3()
    const btc = new Ammo.btVector3()
    const triMesh = new Ammo.btTriangleMesh(true, false)

    this.iterateGeometries(mesh, meshConfig, (geo: any, transform: any) => {
      const components = geo.attributes.position.array
      if (geo.index) {
        for (let i = 0; i < geo.index.count; i += 3) {
          const ai = geo.index.array[i] * 3
          const bi = geo.index.array[i + 1] * 3
          const ci = geo.index.array[i + 2] * 3
          va.set(components[ai], components[ai + 1], components[ai + 2]).applyMatrix4(transform)
          vb.set(components[bi], components[bi + 1], components[bi + 2]).applyMatrix4(transform)
          vc.set(components[ci], components[ci + 1], components[ci + 2]).applyMatrix4(transform)
          bta.setValue(va.x, va.y, va.z)
          btb.setValue(vb.x, vb.y, vb.z)
          btc.setValue(vc.x, vc.y, vc.z)
          triMesh.addTriangle(bta, btb, btc, false)
        }
      } else {
        for (let i = 0; i < components.length; i += 9) {
          va.set(components[i + 0], components[i + 1], components[i + 2]).applyMatrix4(transform)
          vb.set(components[i + 3], components[i + 4], components[i + 5]).applyMatrix4(transform)
          vc.set(components[i + 6], components[i + 7], components[i + 8]).applyMatrix4(transform)
          bta.setValue(va.x, va.y, va.z)
          btb.setValue(vb.x, vb.y, vb.z)
          btc.setValue(vc.x, vc.y, vc.z)
          triMesh.addTriangle(bta, btb, btc, false)
        }
      }
    })

    triMesh.setScaling(new Ammo.btVector3(scale.x, scale.y, scale.z))

    // btBvhTriangleMeshShape can be used for static objects only.
    // https://stackoverflow.com/questions/32668218/concave-collision-detection-in-bullet

    const collisionShape =
      shape === 'convex'
        ? new Ammo.btConvexTriangleMeshShape(triMesh, true)
        : new Ammo.btBvhTriangleMeshShape(triMesh, true)

    // Will be done by the addExisting method
    // collisionShape.setMargin(0.05)
    // this.addRigidBody(mesh, collisionShape, mass, pos, quat)
    // this.addBodyProperties(mesh, meshConfig)

    return collisionShape
  }

  private addBodyProperties(obj: ExtendedObject3D, config: any) {
    const { friction = 0.5, collisionFlag = 0 } = config

    obj.body.ammo.setCollisionFlags(collisionFlag)
    obj.body.ammo.setFriction(friction)
  }

  private addExtrude(extrudeConfig: ExtrudeConfig, materialConfig: MaterialConfig = {}) {
    const object = this.phaser3D.add.extrude(extrudeConfig, materialConfig)

    const { position: pos, quaternion: quat } = object
    const { mass = 1 } = extrudeConfig

    const shape = this.addTriMeshShape(object, extrudeConfig)
    shape.setMargin(0.05)

    this.addRigidBody(object, shape, mass, pos, quat)
    this.addBodyProperties(object, extrudeConfig)

    return object
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

  private addCylinder(cylinderConfig: CylinderConfig = {}, materialConfig: MaterialConfig = {}) {
    const cylinder = this.phaser3D.add.cylinder(cylinderConfig, materialConfig)

    // @ts-ignore
    const { radiusTop = 1, radiusBottom = 1, height = 1 } = cylinder.geometry.parameters
    const { position: pos, quaternion: quat } = cylinder
    const { mass = 1 } = cylinderConfig

    const btHalfExtents = new Ammo.btVector3(radiusTop, height * 0.5, radiusBottom)
    const ballShape = new Ammo.btCylinderShape(btHalfExtents)
    ballShape.setMargin(0.05)

    this.addRigidBody(cylinder, ballShape, mass, pos, quat)
    this.addBodyProperties(cylinder, cylinderConfig)

    return cylinder
  }
}

applyMixins(AmmoPhysics, [Constraints])

export default AmmoPhysics
