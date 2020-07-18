/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import logger from '@enable3d/common/dist/logger'
import PhysicsBody from '@enable3d/common/dist/physicsBody'

import { ExtendedObject3D } from '@enable3d/common/dist/extendedObject3D'
export { ExtendedObject3D }

import { ExtendedMesh } from '@enable3d/common/dist/extendedMesh'
export { ExtendedMesh }

import { ExtendedGroup } from '@enable3d/common/dist/extendedGroup'
export { ExtendedGroup }

import Shapes from './shapes'
import Constraints from './constraints'
import EventEmitter from 'eventemitter3'
import { Vector3, Quaternion, Scene, Mesh, Euler } from '@enable3d/three-wrapper/dist/index'
import { createCollisionShapes } from './three-to-ammo'
import { addTorusShape } from './torusShape'
import Factories from '@enable3d/common/dist/factories'
import { CollisionEvents } from './collisionEvents'
import { REVISION } from '@enable3d/three-wrapper/dist/index'

import DebugDrawer from './debugDrawer'
import { ConvexObjectBreaker } from './convexObjectBreaker'

import { PhysicsLoader } from '@enable3d/common/dist/physicsLoader'
import DefaultMaterial from '@enable3d/common/dist/defaultMaterial'
export { PhysicsLoader }

import * as Types from '@enable3d/common/dist/types'
import { ClosestRaycaster, AllHitsRaycaster } from './raycaster/raycaster'
export { ClosestRaycaster, AllHitsRaycaster }
export { Types }

// Export THREE.Clock
export { Clock } from './lib/Clock'

interface AmmoPhysics {}

class AmmoPhysics extends EventEmitter {
  public tmpTrans: Ammo.btTransform
  public factory: Factories
  public isHeadless: boolean

  public rigidBodies: ExtendedObject3D[] = []
  public objectsAmmo: { [ptr: number]: ExtendedObject3D } = {}
  protected earlierDetectedCollisions: { combinedName: string; collision: boolean }[] = []
  protected gravity: { x: number; y: number; z: number }

  protected tmpEuler: Euler
  protected tmpQuaternion: Quaternion
  protected tmpVector3: Vector3
  protected tmpBtVector3: Ammo.btVector3
  protected tmpBtQuaternion: Ammo.btQuaternion

  public physicsWorld: Ammo.btDiscreteDynamicsWorld
  protected dispatcher: Ammo.btCollisionDispatcher
  protected debugDrawer: DebugDrawer
  private convexBreaker: any
  protected addRigidBody: (threeObject: ExtendedObject3D, physicsShape: any, mass: any, pos: any, quat: any) => void
  private objectsToRemove: any[]
  private numObjectsToRemove: number

  protected emptyV3: Vector3
  protected impactPoint: Vector3
  protected impactNormal: Vector3

  protected defaultMaterial: DefaultMaterial

  private shapes: Shapes
  private constraints: Constraints
  private collisionEvents: CollisionEvents

  constructor(public scene: Scene | 'headless', public config: Types.ThreeGraphicsConfig = {}) {
    super()

    this.gravity = config.gravity || { x: 0, y: -9.81, z: 0 }
    this.isHeadless = scene === 'headless' ? true : false

    this.tmpEuler = new Euler()
    this.tmpQuaternion = new Quaternion()
    this.tmpVector3 = new Vector3()
    this.tmpBtVector3 = new Ammo.btVector3()
    this.tmpBtQuaternion = new Ammo.btQuaternion(0, 0, 0, 1)
    this.emptyV3 = new Vector3()
    this.impactPoint = new Vector3()
    this.impactNormal = new Vector3()

    if (scene !== 'headless') {
      this.defaultMaterial = new DefaultMaterial()

      const version = `three.js version ${REVISION}`
      console.log(
        `%c %c %c %c %c ${version} %c https://threejs.org/`,
        'background: #ff0000',
        'background: #ffff00',
        'background: #00ff00',
        'background: #00ffff',
        'color: #fff; background: #000000;',
        'background: none'
      )
    }

    this.start()
  }

  /** Destroys a physics body. */
  public destroy(body: PhysicsBody | ExtendedObject3D | ExtendedMesh) {
    // @ts-ignore
    const b: PhysicsBody = Object.keys(body).includes('body') ? body.body : body

    if (typeof b?.ammo === 'undefined') return

    const ptr = Object.values(b.ammo)[0]
    const name = Object.values(b.ammo)[1]
    const obj = this.objectsAmmo[ptr]

    // TODO: Remember why I track objectsAmmo and rigidBodies?
    // console.log(this.objectsAmmo)
    // console.log(this.rigidBodies)

    if (ptr && name && obj) {
      if (obj?.body?.ammo) {
        // remove from physics world
        this.physicsWorld.removeRigidBody(obj.body.ammo)

        // call destructor on body
        obj.body.destructor()

        // reset properties
        // @ts-ignore
        obj.body = undefined
        obj.hasBody = false

        // remove from this.objectAmmo
        delete this.objectsAmmo[ptr]
        // remove from this.rigidBodies
        for (let i = 0; i < this.rigidBodies.length; i++) {
          if (this.rigidBodies[i].name === name) {
            this.rigidBodies.splice(i, 1)
            i--
          }
        }
      }
    }

    // @ts-ignore
    if (this.scene === 'headless' && obj) obj = null
  }

  protected setup() {
    // setup ammo physics
    this.setupPhysicsWorld()

    if (this.scene !== 'headless') {
      // Initialize convexBreaker
      // @ts-ignore
      this.convexBreaker = new ConvexObjectBreaker()

      this.objectsToRemove = []
      this.numObjectsToRemove = 0
      for (let i = 0; i < 500; i++) {
        this.objectsToRemove[i] = null
      }
    }

    this.collisionEvents = new CollisionEvents()
    this.factory = new Factories(this.scene)
    this.shapes = new Shapes(this.factory, (object: ExtendedObject3D, config?: Types.AddExistingConfig) =>
      this.addExisting(object, config)
    )
    this.constraints = new Constraints(this.tmpTrans, this.physicsWorld)

    if (this.scene !== 'headless') this.debugDrawer = new DebugDrawer(this.scene, this.physicsWorld, {})
  }

  public updateDebugger() {
    if (this.scene === 'headless') return

    if (this.debugDrawer && this.debugDrawer.enabled) this.debugDrawer.update()
  }

  protected setupPhysicsWorld() {
    const g = this.gravity

    const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration()
    const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration)
    const broadphase = new Ammo.btDbvtBroadphase()
    const solver = new Ammo.btSequentialImpulseConstraintSolver()
    this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration)
    this.physicsWorld.setGravity(new Ammo.btVector3(g.x, g.y, g.z))
    this.dispatcher = dispatcher
    this.tmpTrans = new Ammo.btTransform()
  }

  private createDebrisFromBreakableObject(object: ExtendedObject3D, parent: ExtendedObject3D) {
    if (this.scene === 'headless') return

    object.material = this.defaultMaterial.get()
    object.shape = 'hull'
    object.fragmentDepth = parent.fragmentDepth + 1

    // Add the object to the scene
    this.scene.add(object)

    // Add physics to the object
    // @ts-ignore
    this.addExisting(object)

    object.body.breakable = false
    // make this fragment breakable in 2.5seconds
    setTimeout(() => {
      object.body.breakable = true
    }, 2500)
  }

  private removeDebris(object: any) {
    if (this.scene === 'headless') return

    this.scene.remove(object)
    this.physicsWorld.removeRigidBody(object.body.ammo)
    delete this.objectsAmmo[object.ptr]
  }

  public update(delta: number) {
    // reset these vectors
    this.impactPoint.set(0, 0, 0)
    this.impactNormal.set(0, 0, 0)

    const detectedCollisions: { combinedName: string; collision: boolean }[] = []

    // Step world
    const deltaTime = delta / 1000

    // must always satisfy the equation timeStep < maxSubSteps * fixedTimeStep
    this.physicsWorld.stepSimulation(deltaTime, this.config.maxSubSteps || 4, this.config.fixedTimeStep || 1 / 60)

    /**
     * Update rigid bodies
     */
    for (let i = 0, il = this.rigidBodies.length; i < il; i++) {
      const objThree = this.rigidBodies[i]
      const objPhys = objThree.body.ammo
      const ms = objPhys.getMotionState()

      if (ms) {
        ms.getWorldTransform(this.tmpTrans)

        // check if object did an update since last call
        if (objThree.body.didUpdate) {
          // @ts-ignore
          if (objThree.body._emitUpdateEvents) objThree.body.eventEmitter.emit('update')
          objThree.body.didUpdate = false
        }

        // update positions
        if (objThree.body.ammo.isKinematicObject() && objThree.body.needUpdate) {
          // get position and rotation
          objThree.getWorldQuaternion(this.tmpQuaternion)
          objThree.getWorldPosition(this.tmpVector3)
          // adjust tmp variables
          this.tmpBtVector3.setValue(this.tmpVector3.x, this.tmpVector3.y, this.tmpVector3.z)
          this.tmpBtQuaternion.setValue(
            this.tmpQuaternion.x,
            this.tmpQuaternion.y,
            this.tmpQuaternion.z,
            this.tmpQuaternion.w
          )
          // set position and rotation
          this.tmpTrans.setOrigin(this.tmpBtVector3)
          this.tmpTrans.setRotation(this.tmpBtQuaternion)
          // set transform
          ms.setWorldTransform(this.tmpTrans)
          // reset needsUpdate
          objThree.body.needUpdate = false
        } else {
          // get position and rotation
          let p = this.tmpTrans.getOrigin()
          let q = this.tmpTrans.getRotation()
          // body offset
          let o = objThree.body.offset
          // set position and rotation
          objThree.position.set(p.x() + o.x, p.y() + o.y, p.z() + o.z)
          objThree.quaternion.set(q.x(), q.y(), q.z(), q.w())
        }
      }
    }

    // check collisions
    for (let i = 0, il = this.dispatcher.getNumManifolds(); i < il; i++) {
      const contactManifold = this.dispatcher.getManifoldByIndexInternal(i)
      const key = Object.keys(contactManifold.getBody0())[0]

      // @ts-ignore
      const body0 = Ammo.castObject(contactManifold.getBody0(), Ammo.btRigidBody)
      // @ts-ignore
      const body1 = Ammo.castObject(contactManifold.getBody1(), Ammo.btRigidBody)

      // do not check collision between 2 unnamed objects
      // (fragments do not have a name, for example)
      if (body0.name === '' && body1.name === '') continue

      // @ts-ignore
      const ptr0 = body0[key]
      // @ts-ignore
      const ptr1 = body1[key]

      const threeObject0 = this.objectsAmmo[ptr0] as ExtendedObject3D
      const threeObject1 = this.objectsAmmo[ptr1] as ExtendedObject3D

      if (!threeObject0 || !threeObject1) {
        continue
      }

      /**
       * Get some information
       */
      const breakable0 = threeObject0.body.breakable
      const breakable1 = threeObject1.body.breakable

      const checkCollisions0 = threeObject0.body?.checkCollisions
      const checkCollisions1 = threeObject1.body?.checkCollisions

      if (!checkCollisions0 && !checkCollisions1 && !breakable0 && !breakable1) continue

      let contact = false
      let maxImpulse = 0

      let event: Types.CollisionEvent = 'start'

      for (let j = 0, jl = contactManifold.getNumContacts(); j < jl; j++) {
        const contactPoint = contactManifold.getContactPoint(j)

        // Distance definition: when the distance between objects is positive, they are separated. When the distance is negative, they are penetrating. Zero distance means exactly touching.
        // https://pybullet.org/Bullet/phpBB3/viewtopic.php?t=5831
        if (contactPoint.getDistance() <= 0) {
          contact = true
          const impulse = contactPoint.getAppliedImpulse()
          const impactPoint = contactPoint.get_m_positionWorldOnB()
          const impactNormal = contactPoint.get_m_normalWorldOnB()

          // handle collision events
          if (checkCollisions0 || checkCollisions1) {
            const names = [threeObject0.name, threeObject1.name].sort()
            const combinedName = `${names[0]}__${names[1]}`

            if (this.earlierDetectedCollisions.find(el => el.combinedName === combinedName)) event = 'collision'

            if (!detectedCollisions.find(el => el.combinedName === combinedName)) {
              detectedCollisions.push({ combinedName, collision: true })
              this.collisionEvents.emit('collision', { bodies: [threeObject0, threeObject1], event })
            }
          }

          // get impactPoint and impactNormal of the hight impulse point (for breakable objects)
          if (impulse >= maxImpulse) {
            maxImpulse = impulse
            // get what ween need for the convex breaking
            if (breakable0 || breakable1) {
              this.impactPoint.set(impactPoint.x(), impactPoint.y(), impactPoint.z())
              this.impactNormal.set(impactNormal.x(), impactNormal.y(), impactNormal.z())
            }
          }

          break
        }
      }

      // If no point has contact, abort
      if (!contact) continue

      if (!breakable0 && !breakable1) continue

      /**
       * Check for breakable objects (subdivision)
       */
      const fractureImpulse = 5 //250
      const MAX_FRAGMENT_DEPTH = 2

      // since the library convexBreaker makes use of three's userData.ammoPhysicsData
      // we have to clone the necessary params to threeObjectX.userData.ammoPhysicsData
      // TODO improve this

      this.emptyV3.set(0, 0, 0)
      threeObject0.userData.ammoPhysicsData = {
        mass: 1,
        velocity: this.emptyV3,
        angularVelocity: this.emptyV3,
        breakable: breakable0,
        physicsBody: body0
      }
      threeObject1.userData.ammoPhysicsData = {
        mass: 1,
        velocity: this.emptyV3,
        angularVelocity: this.emptyV3,
        breakable: breakable1,
        physicsBody: body1
      }
      if (typeof threeObject0.fragmentDepth === 'undefined') threeObject0.fragmentDepth = 0
      if (typeof threeObject1.fragmentDepth === 'undefined') threeObject1.fragmentDepth = 0

      // threeObject0
      if (breakable0 && maxImpulse > fractureImpulse && threeObject0.fragmentDepth < MAX_FRAGMENT_DEPTH) {
        const debris = this.convexBreaker.subdivideByImpact(threeObject0, this.impactPoint, this.impactNormal, 1, 2) //, 1.5)

        const numObjects = debris.length
        for (let j = 0; j < numObjects; j++) {
          const vel = body0.getLinearVelocity()
          const angVel = body0.getAngularVelocity()
          const fragment = debris[j] as ExtendedObject3D
          fragment.userData.ammoPhysicsData.velocity.set(vel.x(), vel.y(), vel.z())
          fragment.userData.ammoPhysicsData.angularVelocity.set(angVel.x(), angVel.y(), angVel.z())

          this.createDebrisFromBreakableObject(fragment, threeObject0)
        }

        this.objectsToRemove[this.numObjectsToRemove++] = threeObject0
      }

      // threeObject1
      if (breakable1 && maxImpulse > fractureImpulse && threeObject1.fragmentDepth < MAX_FRAGMENT_DEPTH) {
        const debris = this.convexBreaker.subdivideByImpact(threeObject1, this.impactPoint, this.impactNormal, 1, 2) //, 1.5)

        const numObjects = debris.length
        for (let j = 0; j < numObjects; j++) {
          const vel = body1.getLinearVelocity()
          const angVel = body1.getAngularVelocity()
          const fragment = debris[j] as ExtendedObject3D
          fragment.userData.ammoPhysicsData.velocity.set(vel.x(), vel.y(), vel.z())
          fragment.userData.ammoPhysicsData.angularVelocity.set(angVel.x(), angVel.y(), angVel.z())

          this.createDebrisFromBreakableObject(fragment, threeObject1)
        }

        this.objectsToRemove[this.numObjectsToRemove++] = threeObject1
      }
    }

    // remove objects
    for (let i = 0; i < this.numObjectsToRemove; i++) {
      this.removeDebris(this.objectsToRemove[i])
    }
    this.numObjectsToRemove = 0

    // handle collision end events
    this.earlierDetectedCollisions.forEach(el => {
      const { combinedName } = el
      if (!detectedCollisions.find(el => el.combinedName === combinedName)) {
        const split = combinedName.split('__')
        const obj0 = this.rigidBodies.find(obj => obj.name === split[0])
        const obj1 = this.rigidBodies.find(obj => obj.name === split[1])
        const event = 'end'
        if (obj0 && obj1) this.collisionEvents.emit('collision', { bodies: [obj0, obj1], event })
      }
    })
    this.earlierDetectedCollisions = [...detectedCollisions]
  }

  public setGravity(x = 0, y = -9.8, z = 0) {
    this.tmpBtVector3.setValue(x, y, z)
    this.physicsWorld.setGravity(this.tmpBtVector3)
  }

  public get debug() {
    if (this.isHeadless) return null

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
        eventCallback: (event: Types.CollisionEvent) => void
      ) => this.collisionEvents.addCollider(object1, object2, eventCallback),
      constraints: this.constraints.addConstraints,
      existing: (object: ExtendedObject3D, config?: Types.AddExistingConfig) => this.addExisting(object, config),
      plane: (planeConfig: Types.PlaneConfig = {}, materialConfig: Types.MaterialConfig = {}) =>
        this.shapes.addPlane(planeConfig, materialConfig),
      sphere: (sphereConfig: Types.SphereConfig = {}, materialConfig: Types.MaterialConfig = {}) =>
        this.shapes.addSphere(sphereConfig, materialConfig),
      ground: (groundConfig: Types.GroundConfig = {}, materialConfig: Types.MaterialConfig = {}) =>
        this.shapes.addGround(groundConfig, materialConfig),
      box: (boxConfig: Types.BoxConfig = {}, materialConfig: Types.MaterialConfig = {}) =>
        this.shapes.addBox(boxConfig, materialConfig),
      cylinder: (cylinderConfig: Types.CylinderConfig = {}, materialConfig: Types.MaterialConfig = {}) =>
        this.shapes.addCylinder(cylinderConfig, materialConfig),
      cone: (coneConfig: Types.ConeConfig = {}, materialConfig: Types.MaterialConfig = {}) =>
        this.shapes.addCone(coneConfig, materialConfig),
      torus: (torusConfig: Types.TorusConfig = {}, materialConfig: Types.MaterialConfig = {}) =>
        this.shapes.addTorus(torusConfig, materialConfig),
      extrude: (extrudeConfig: Types.ExtrudeConfig, materialConfig: Types.MaterialConfig = {}) =>
        this.shapes.addExtrude(extrudeConfig, materialConfig),
      /**
       * Creates a new Raycaster
       * @param type Returns only the closes body by default. Can be 'closest' or 'allHits'.
       */
      raycaster: (type = 'closest') => {
        if (type === 'closest') return new ClosestRaycaster(this) as ClosestRaycaster
        else return new AllHitsRaycaster(this) as AllHitsRaycaster
      }
    }
  }

  private prepareThreeObjectForCollisionShape(object: ExtendedObject3D, config: Types.AddExistingConfig = {}) {
    const { position: pos, quaternion: quat, hasBody } = object
    const { autoCenter = false } = config

    // set default params
    const defaultParams = {
      width: 1,
      height: 1,
      depth: 1,
      radius: 1,
      radiusTop: 1, // for the cylinder
      radiusBottom: 1, // for the cylinder
      tube: 0.4, // for the torus
      tubularSegments: 6 // for the torus
    }

    // determine the shape (fallback to hacd)
    let shape: string = 'unknown'
    // retrieve the shape from the geometry
    const type = object.geometry?.type || 'unknown'
    if (/box/i.test(type)) shape = 'box'
    else if (/cone/i.test(type)) shape = 'cone'
    else if (/cylinder/i.test(type)) shape = 'cylinder'
    else if (/extrude/i.test(type)) shape = 'extrude'
    else if (/plane/i.test(type)) shape = 'plane'
    else if (/sphere/i.test(type)) shape = 'sphere'
    else if (/torus/i.test(type)) shape = 'torus'

    // @ts-ignore
    let params = { ...defaultParams, ...object?.geometry?.parameters }

    if (config.shape) {
      params = { ...defaultParams, ...config }
      shape = config.shape
    } else if (object.shape) {
      shape = object.shape
    }

    // Add all default params if undefined
    Object.keys(params).forEach(key => {
      // @ts-ignore
      if (typeof params[key] === 'undefined' && defaultParams[key]) {
        // @ts-ignore
        params[key] = defaultParams[key]
      }
    })

    // auto adjust the center for custom shapes
    if (autoCenter) object.geometry.center()

    // some aliases
    if (shape === 'extrude') shape = 'hacd'
    if (shape === 'mesh' || shape === 'convex') shape = 'convexMesh'
    if (shape === 'concave') shape = 'concaveMesh'

    // if we have not found a shape until here, we fallback to 'box'
    if (shape === 'unknown') {
      logger(`Shape for ${object?.name} not recognized! Will fallback to box.`)
      shape = 'box'
    }

    return { shape, params, object }
  }

  public createCollisionShape(shape: string, params: any, object?: ExtendedObject3D): Ammo.btCollisionShape {
    const quat = object?.quaternion ? object?.quaternion : new Quaternion(0, 0, 0, 1)

    let collisionShape
    switch (shape) {
      case 'box':
        collisionShape = new Ammo.btBoxShape(new Ammo.btVector3(params.width / 2, params.height / 2, params.depth / 2))
        break
      case 'sphere':
        collisionShape = new Ammo.btSphereShape(params.radius)
        break
      case 'cylinder':
        collisionShape = new Ammo.btCylinderShape(new Ammo.btVector3(params.radiusTop, params.height / 2, 0))
        break
      case 'cone':
        collisionShape = new Ammo.btConeShape(params.radius, params.height)
        break
      case 'torus':
        collisionShape = addTorusShape(params, quat)
        break
      case 'capsule':
        collisionShape = new Ammo.btCapsuleShape(params.radius, params.height)
        break
      case 'plane':
        collisionShape = createCollisionShapes(object, { type: 'mesh', concave: false, ...params.collider || {}})
        break
      case 'hull':
        collisionShape = createCollisionShapes(object, { type: 'hull', ...params.collider || {} })
        break
      case 'hacd':
        collisionShape = createCollisionShapes(object, { type: 'hacd', ...params.collider || {} })
        break
      case 'vhacd':
        collisionShape = createCollisionShapes(object, { type: 'vhacd', ...params.collider || {} })
        break
      case 'convexMesh':
        collisionShape = createCollisionShapes(object, { type: 'mesh', concave: false, ...params.collider || {} })
        break
      case 'concaveMesh':
        collisionShape = createCollisionShapes(object, { type: 'mesh', concave: true, ...params.collider || {} })
        break
    }

    // if there is a x, y or z, take is as temporary offset parameter
    const { x, y, z } = params
    if (x || y || z) {
      // @ts-ignore
      collisionShape.offset = { x: x || 0, y: y || 0, z: z || 0 }
    }

    // in some cases, like hacd, it will be an array of shapes
    // so we merge them
    if (Array.isArray(collisionShape)) collisionShape = this.mergeCollisionShapesToCompoundShape(collisionShape)

    return collisionShape as Ammo.btCollisionShape
  }

  public mergeCollisionShapesToCompoundShape(collisionShapes: Ammo.btCollisionShape[]): Ammo.btCompoundShape {
    const compoundShape = new Ammo.btCompoundShape()
    collisionShapes.forEach(shape => {
      // @ts-ignore
      const { offset } = shape // offset is a custom parameter

      const transform = new Ammo.btTransform()
      transform.setIdentity()
      if (offset) transform.setOrigin(new Ammo.btVector3(offset.x || 0, offset.y || 0, offset.z || 0))
      compoundShape.addChildShape(transform, shape)
    })
    return compoundShape
  }

  protected addExisting(object: ExtendedObject3D, config: Types.AddExistingConfig = {}): any {
    const { hasBody } = object
    if (hasBody) {
      console.warn(`[Enable3d]: Object "${object.name}" already has a physical body!`)
      return
    }

    const { position: pos, quaternion: quat } = object
    const {
      shape = 'unknown',
      compound = [],
      mass = 1,
      collisionFlags = 0,
      offset = undefined,
      breakable = false,
      addChildren = true
    } = config

    if (compound.length >= 1) {
      // if we want a custom compound shape, we simply do
      const collisionShapes = compound.map((s: any) => this.createCollisionShape(s.shape, s))
      const compoundShape = this.mergeCollisionShapesToCompoundShape(collisionShapes)
      const rigidBody = this.collisionShapeToRigidBody(compoundShape, object.position, object.quaternion, 1)
      this.addRigidBodyToWorld(object, rigidBody)
      return
    }

    const collisionShapes: Ammo.btCollisionShape[] = []

    // if object is a THREE.Group, object does not have a mesh
    if (shape !== 'unknown' || object.isMesh) {
      const p = this.prepareThreeObjectForCollisionShape(object, config)
      const cs = this.createCollisionShape(p.shape, p.params, p.object)
      collisionShapes.push(cs)
    }

    // check if the object has children
    if (shape === 'unknown' && addChildren && object.children.length >= 1) {
      object.children.forEach((child: any) => {
        if (child.isMesh) {
          const p = this.prepareThreeObjectForCollisionShape(child)
          const cs = this.createCollisionShape(p.shape, p.params, p.object)
          // @ts-ignore
          cs.offset = child.position.clone() // this is relative position to its parent
          collisionShapes.push(cs)
        }
      })
    }

    // FALLBACK: if we do not have any collisionShapes yet, add a simple box as a fallback
    if (collisionShapes.length === 0) {
      const p = this.prepareThreeObjectForCollisionShape(object, config)
      const cs = this.createCollisionShape(p.shape, p.params, p.object)
      collisionShapes.push(cs)
    }

    const collisionShape =
      collisionShapes.length === 1 ? collisionShapes[0] : this.mergeCollisionShapesToCompoundShape(collisionShapes)

    // add rigid body
    // object.position.copy(pos)
    // object.quaternion.copy(quat)

    const rigidBody = this.collisionShapeToRigidBody(collisionShape, pos, quat, mass)

    // const scale = { x: 1, y: 1, z: 1 }
    // if (scale) {
    //   const localScale = new Ammo.btVector3(scale.x, scale.y, scale.z)
    //   Shape.setLocalScaling(localScale)
    //   Ammo.destroy(localScale)
    // }

    this.addRigidBodyToWorld(object, rigidBody, collisionFlags, breakable, offset)
  }

  public addRigidBodyToWorld(
    object: ExtendedObject3D,
    rigidBody: Ammo.btRigidBody,
    collisionFlags = 0,
    breakable?: boolean,
    offset?: { x?: number; y?: number; z?: number }
  ) {
    this.rigidBodies.push(object)
    this.physicsWorld.addRigidBody(rigidBody)

    const ptr = Object.values(rigidBody)[0]
    // @ts-ignore
    rigidBody.name = object.name
    object.body = new PhysicsBody(this, rigidBody)
    object.hasBody = true
    // @ts-ignore
    object.ptr = ptr
    this.objectsAmmo[ptr] = object

    if (breakable) object.body.breakable = true
    if (offset) object.body.offset = { x: 0, y: 0, z: 0, ...offset }

    object.body.setCollisionFlags(collisionFlags)
  }

  public collisionShapeToRigidBody(
    physicsShape: Ammo.btCollisionShape,
    pos: Vector3,
    quat: Quaternion,
    mass: number = 1
  ) {
    const transform = new Ammo.btTransform()
    transform.setIdentity()
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z))
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w))
    const motionState = new Ammo.btDefaultMotionState(transform)
    const localInertia = new Ammo.btVector3(0, 0, 0)
    if (mass > 0) physicsShape.calculateLocalInertia(mass, localInertia)
    const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, physicsShape, localInertia)
    const rigidBody = new Ammo.btRigidBody(rbInfo)
    if (mass > 0) rigidBody.setActivationState(4) // Disable deactivation
    return rigidBody
  }
}

export { AmmoPhysics }
