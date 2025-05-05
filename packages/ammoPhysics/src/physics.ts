/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|LGPL-3.0}
 */

import { logger } from '@enable3d/common/dist/logger.js'
import PhysicsBody from '@enable3d/common/dist/physicsBody.js'

import { ExtendedObject3D } from '@enable3d/common/dist/extendedObject3D.js'
export { ExtendedObject3D }

import { ExtendedMesh } from '@enable3d/common/dist/extendedMesh.js'
export { ExtendedMesh }

import { ExtendedGroup } from '@enable3d/common/dist/extendedGroup.js'
export { ExtendedGroup }

import Shapes from './shapes.js'
import Constraints from './constraints.js'
import { Events } from '@yandeu/events'
import { Geometry } from './externals.js'
import {
  Box3,
  BufferGeometry,
  Euler,
  Group,
  Material,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  REVISION,
  Scene,
  Vector3
} from 'three'
import {
  createHACDShapes,
  createHullShape,
  createTriMeshShape,
  createVHACDShapes,
  iterateGeometries
} from './three-to-ammo.js'
import { createTorusShape } from './torusShape.js'
import Factories from '@enable3d/common/dist/factories.js'
import { CollisionEvents } from './collisionEvents.js'

import DebugDrawer from './debugDrawer.js'
import { ConvexObjectBreaker } from './convexObjectBreaker.js'

import { PhysicsLoader } from '@enable3d/common/dist/physicsLoader.js'
import DefaultMaterial from '@enable3d/common/dist/defaultMaterial.js'
export { PhysicsLoader }

import * as Types from '@enable3d/common/dist/types.js'
import { AllHitsRaycaster, ClosestRaycaster } from './raycaster/raycaster.js'
export { ClosestRaycaster, AllHitsRaycaster }
export { Types }

// Export THREE.Clock
export { Clock } from './lib/Clock.js'

class AmmoPhysics extends Events {
  public worldTransform!: Ammo.btTransform
  public factory!: Factories
  public isHeadless: boolean

  public rigidBodies: Array<ExtendedMesh | ExtendedGroup> = []
  protected earlierDetectedCollisions: { combinedName: string; collision: boolean }[] = []
  protected gravity: { x: number; y: number; z: number }

  protected tmpEuler: Euler
  protected tmpQuaternion: Quaternion
  protected tmpVector3: Vector3
  protected tmpVector3a: Vector3
  protected tmpMatrix4: Matrix4
  protected tmpMatrix4a: Matrix4
  protected tmpBtVector3: Ammo.btVector3
  protected tmpBtQuaternion: Ammo.btQuaternion

  public physicsWorld!: Ammo.btSoftRigidDynamicsWorld
  protected debugDrawer!: DebugDrawer
  private convexBreaker: any
  protected addRigidBody!: (threeObject: ExtendedMesh, physicsShape: any, mass: any, pos: any, quat: any) => void
  private objectsToRemove!: any[]
  private numObjectsToRemove!: number

  protected emptyV3: Vector3
  protected impactPoint: Vector3
  protected impactNormal: Vector3

  protected defaultMaterial!: DefaultMaterial

  private shapes!: Shapes
  private constraints!: Constraints
  public collisionEvents!: CollisionEvents

  private readonly complexShapes = ['plane', 'hull', 'hacd', 'vhacd', 'convexMesh', 'concaveMesh']

  constructor(
    public scene: Scene | 'headless',
    public config: Types.ThreeGraphicsConfig = {}
  ) {
    super()

    this.gravity = config.gravity || { x: 0, y: -9.81, z: 0 }
    this.isHeadless = scene === 'headless' ? true : false

    this.tmpEuler = new Euler()
    this.tmpQuaternion = new Quaternion()
    this.tmpVector3 = new Vector3()
    this.tmpVector3a = new Vector3()
    this.tmpMatrix4 = new Matrix4()
    this.tmpMatrix4a = new Matrix4()
    this.tmpBtVector3 = new Ammo.btVector3()
    this.tmpBtQuaternion = new Ammo.btQuaternion(0, 0, 0, 1)
    this.emptyV3 = new Vector3()
    this.impactPoint = new Vector3()
    this.impactNormal = new Vector3()

    if (scene !== 'headless') {
      this.defaultMaterial = new DefaultMaterial()

      // const info = `Ammo.js physics provided by enable3d`
      // console.log(
      //   `%c %c %c %c %c ${info} %c https://enable3d.io/`,
      //   'background: #ff0000',
      //   'background: #ffff00',
      //   'background: #00ff00',
      //   'background: #00ffff',
      //   'color: #fff; background: #000000;',
      //   'background: none'
      // )
    }

    this.start()
  }

  /** @deprecated Use worldTransform instead of tmpTrans. */
  get tmpTrans() {
    console.warn('Use worldTransform instead of tmpTrans.')
    return this.worldTransform
  }

  /** @deprecated Use worldTransform instead of tmpTrans. */
  set tmpTrans(transform: Ammo.btTransform) {
    console.warn('Use worldTransform instead of tmpTrans.')
    this.worldTransform = transform
  }

  /** Destroys a physics body. */
  public destroy(body: ExtendedMesh | ExtendedGroup) {
    const b = Object.keys(body).includes('body') ? (body.body as PhysicsBody) : (body as unknown as PhysicsBody)
    if (typeof b?.ammo === 'undefined') return

    // @ts-expect-error: threeObject does not exist on btRigidBody.
    let obj: ExtendedMesh | null = b.ammo.threeObject as ExtendedMesh
    const name = obj.name

    if (name && obj) {
      if (obj?.body?.ammo) {
        // remove from physics world
        !obj.body.isSoftBody
          ? this.physicsWorld.removeRigidBody(obj.body.ammo)
          : this.physicsWorld.removeSoftBody(obj.body.ammo as any)

        // call destructor on body
        obj.body.destructor()

        // reset properties
        // @ts-expect-error: body (PhysicsBody) can't be undefined.
        obj.body = undefined
        obj.hasBody = false

        // remove from this.objectAmmo
        // @ts-expect-error: threeObject does not exist on btRigidBody.
        delete b.ammo.threeObject
        // remove from this.rigidBodies
        for (let i = 0; i < this.rigidBodies.length; i++) {
          if (this.rigidBodies[i].name === name) {
            this.rigidBodies.splice(i, 1)
            i--
          }
        }
      }
    }

    if (this.scene === 'headless' && obj) obj = null
  }

  protected setup() {
    // add worldTransform
    this.worldTransform = new Ammo.btTransform()

    // setup ammo physics
    if (typeof this.config.setupPhysicsWorld === 'function') this.physicsWorld = this.config.setupPhysicsWorld() as any
    else this.physicsWorld = this.setupPhysicsWorld()

    if (this.scene !== 'headless') {
      // Initialize convexBreaker
      // @ts-expect-error: ConvexObjectBreaker is not a real class.
      this.convexBreaker = new ConvexObjectBreaker()

      this.objectsToRemove = []
      this.numObjectsToRemove = 0
      for (let i = 0; i < 500; i++) {
        this.objectsToRemove[i] = null
      }
    }

    this.collisionEvents = new CollisionEvents()
    this.factory = new Factories(this.scene)
    this.shapes = new Shapes(this.factory, (object: ExtendedMesh, config?: Types.AddExistingConfig) =>
      this.addExisting(object, config)
    )
    this.constraints = new Constraints(this.worldTransform, this.physicsWorld)

    if (this.scene !== 'headless') this.debugDrawer = new DebugDrawer(this.scene, this.physicsWorld, {})
  }

  public updateDebugger() {
    if (this.scene === 'headless') return

    if (this.debugDrawer && this.debugDrawer.enabled) this.debugDrawer.update()
  }

  protected setupPhysicsWorld() {
    const g = this.gravity
    const { softBodies = false } = this.config

    let physicsWorld: any

    if (!softBodies) {
      const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
        dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
        broadphase = new Ammo.btDbvtBroadphase(),
        solver = new Ammo.btSequentialImpulseConstraintSolver()
      physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration)
    }

    if (softBodies) {
      const collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration(),
        dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
        broadphase = new Ammo.btDbvtBroadphase(),
        solver = new Ammo.btSequentialImpulseConstraintSolver(),
        softBodySolver = new Ammo.btDefaultSoftBodySolver()
      physicsWorld = new Ammo.btSoftRigidDynamicsWorld(
        dispatcher,
        broadphase,
        solver,
        collisionConfiguration,
        softBodySolver
      )
    }

    physicsWorld.setGravity(new Ammo.btVector3(g.x, g.y, g.z))
    return physicsWorld
  }

  private createDebrisFromBreakableObject(object: ExtendedMesh, parent: ExtendedMesh) {
    if (this.scene === 'headless') return

    object.material = parent.material
    object.shape = 'hull'
    object.fragmentDepth = parent.fragmentDepth + 1
    object.name = `${parent.name}__DEBRIS_${object.id}`

    // Add the object to the scene
    this.scene.add(object)

    // Add physics to the object
    this.addExisting(object, { autoCenter: true })

    object.body.fractureImpulse = parent.body.fractureImpulse
    object.body.breakable = false
    // make this fragment breakable in 2.5seconds
    setTimeout(() => {
      object.body.breakable = true
    }, 2500)
  }

  private removeDebris(object: any) {
    if (this.scene === 'headless') return

    this.scene.remove(object)
    this.destroy(object)
  }

  public update(delta: number) {
    this.updatePhysics(delta)
    this.detectCollisions()
  }

  private updatePhysics(delta: number) {
    // step world
    const deltaTime = delta / 1000

    // must always satisfy the equation timeStep < maxSubSteps * fixedTimeStep
    this.physicsWorld.stepSimulation(deltaTime, this.config.maxSubSteps || 4, this.config.fixedTimeStep || 1 / 60)

    // update rigid bodies
    for (let i = 0; i < this.rigidBodies.length; i++) {
      const objThree = this.rigidBodies[i]
      // reset impact
      objThree.body.impact = []
      const objPhys = objThree.body.ammo
      const ms = objPhys.getMotionState()

      if (ms) {
        ms.getWorldTransform(this.worldTransform)

        // check if object did an update since last call
        if (objThree.body.didUpdate) {
          // @ts-expect-error: We access some private method here.
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
          this.worldTransform.setOrigin(this.tmpBtVector3)
          this.worldTransform.setRotation(this.tmpBtQuaternion)
          // set transform
          ms.setWorldTransform(this.worldTransform)
          // reset needsUpdate
          objThree.body.needUpdate = false
        } else if (objThree.body.skipUpdate) {
          // do nothing ...
        } else if (!objThree.body.ammo.isStaticObject()) {
          // get position and rotation
          const p = this.worldTransform.getOrigin()
          const q = this.worldTransform.getRotation()
          // body offset
          const o = objThree.body.offset
          // set position and rotation
          if (objThree.body.ignoreScale) {
            this.tmpVector3a.set(objThree.scale.x, objThree.scale.y, objThree.scale.z)
          } else {
            const scale = objThree.body.ammo.getCollisionShape().getLocalScaling()
            this.tmpVector3a.set(scale.x(), scale.y(), scale.z())
          }
          this.tmpVector3.set(p.x() + o.x, p.y() + o.y, p.z() + o.z)
          this.tmpQuaternion.set(q.x(), q.y(), q.z(), q.w())
          this.tmpMatrix4.compose(this.tmpVector3, this.tmpQuaternion, this.tmpVector3a)
          if (objThree.parent) {
            // compatibility fix for three.js >= r123 (Dezember 2020)
            if (parseInt(REVISION) >= 123) this.tmpMatrix4a.copy(objThree.parent.matrixWorld).invert()
            // @ts-expect-error getInverse has been deprecated
            else this.tmpMatrix4a.getInverse(objThree.parent.matrixWorld)
          } else {
            this.tmpMatrix4a.identity()
          }
          this.tmpMatrix4a.multiply(this.tmpMatrix4)
          this.tmpMatrix4a.decompose(objThree.position, objThree.quaternion, objThree.scale)
        }
      }
    }
  }

  private detectCollisions() {
    const detectedCollisions: { combinedName: string; collision: boolean }[] = []

    // reset these vectors
    this.impactPoint.set(0, 0, 0)
    this.impactNormal.set(0, 0, 0)

    const dispatcher = this.physicsWorld.getDispatcher()
    const numManifolds = dispatcher.getNumManifolds()

    // check collisions
    for (let i = 0; i < numManifolds; i++) {
      const contactManifold = dispatcher.getManifoldByIndexInternal(i)
      const numContacts = contactManifold.getNumContacts()

      // @ts-expect-error: castObject is not yet defined in the Ammo.js types.
      const rb0 = Ammo.castObject(contactManifold.getBody0(), Ammo.btRigidBody)
      // @ts-expect-error: castObject is not yet defined in the Ammo.js types.
      const rb1 = Ammo.castObject(contactManifold.getBody1(), Ammo.btRigidBody)

      const threeObject0 = rb0.threeObject as ExtendedMesh
      const threeObject1 = rb1.threeObject as ExtendedMesh

      if (!threeObject0 || !threeObject1) {
        continue
      }

      // do not check collision between 2 unnamed objects
      // (fragments do not have a name, for example)
      if (rb0.name === '' && rb1.name === '') continue

      /**
       * Get some information
       */

      const checkCollisions0 = threeObject0.body?.checkCollisions
      const checkCollisions1 = threeObject1.body?.checkCollisions

      const breakable0 = threeObject0.body.breakable
      const breakable1 = threeObject1.body.breakable

      const fractureImpulse0 = threeObject0.body.fractureImpulse
      const fractureImpulse1 = threeObject1.body.fractureImpulse

      const checkCollisions = checkCollisions0 || checkCollisions1
      const checkBreakable = breakable0 || breakable1

      if (typeof threeObject0.fragmentDepth === 'undefined') threeObject0.fragmentDepth = 0
      if (typeof threeObject1.fragmentDepth === 'undefined') threeObject1.fragmentDepth = 0

      if (!checkCollisions && !checkBreakable) continue

      let contact = false
      let maxImpulse = 0

      let event: Types.CollisionEvent = 'start'

      for (let j = 0; j < numContacts; j++) {
        const contactPoint = contactManifold.getContactPoint(j)
        const distance = contactPoint.getDistance()

        // Distance definition: when the distance between objects is positive, they are separated. When the distance is negative, they are penetrating. Zero distance means exactly touching.
        // https://pybullet.org/Bullet/phpBB3/viewtopic.php?t=5831
        if (distance <= 0) {
          contact = true
          const impulse = contactPoint.getAppliedImpulse()
          const impactPoint = contactPoint.get_m_positionWorldOnB()
          const impactNormal = contactPoint.get_m_normalWorldOnB()

          // handle collision events
          if (checkCollisions0 || checkCollisions1) {
            const names = [threeObject0.uuid, threeObject1.uuid].sort()
            const combinedName = `${names[0]}__${names[1]}`

            if (this.earlierDetectedCollisions.find(el => el.combinedName === combinedName)) event = 'collision'

            if (!detectedCollisions.find(el => el.combinedName === combinedName)) {
              detectedCollisions.push({ combinedName, collision: true })
              // store impact in both bodies
              const point = { x: impactPoint.x(), y: impactPoint.y(), z: impactPoint.z() }
              const normal = { x: impactNormal.x(), y: impactNormal.y(), z: impactNormal.z() }
              threeObject0.body.impact.push({ impulse, point, normal, name: threeObject1.name })
              threeObject1.body.impact.push({ impulse, point, normal, name: threeObject0.name })

              // emit collision event
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

      // if no point has contact, abort
      if (!contact) continue

      // if no objects are breakable, abort
      if (!checkBreakable) continue

      /**
       * check for breakable objects (subdivision)
       */
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
        physicsBody: rb0
      }
      threeObject1.userData.ammoPhysicsData = {
        mass: 1,
        velocity: this.emptyV3,
        angularVelocity: this.emptyV3,
        breakable: breakable1,
        physicsBody: rb1
      }

      // threeObject0
      if (breakable0 && maxImpulse > fractureImpulse0 && threeObject0.fragmentDepth < MAX_FRAGMENT_DEPTH) {
        const debris = this.convexBreaker.subdivideByImpact(threeObject0, this.impactPoint, this.impactNormal, 1, 2) //, 1.5)

        const numObjects = debris.length
        for (let j = 0; j < numObjects; j++) {
          const vel = rb0.getLinearVelocity()
          const angVel = rb0.getAngularVelocity()
          const fragment = debris[j] as ExtendedMesh
          fragment.userData.ammoPhysicsData.velocity.set(vel.x(), vel.y(), vel.z())
          fragment.userData.ammoPhysicsData.angularVelocity.set(angVel.x(), angVel.y(), angVel.z())

          this.createDebrisFromBreakableObject(fragment, threeObject0)
        }

        this.objectsToRemove[this.numObjectsToRemove++] = threeObject0
      }

      // threeObject1
      if (breakable1 && maxImpulse > fractureImpulse1 && threeObject1.fragmentDepth < MAX_FRAGMENT_DEPTH) {
        const debris = this.convexBreaker.subdivideByImpact(threeObject1, this.impactPoint, this.impactNormal, 1, 2) //, 1.5)

        const numObjects = debris.length
        for (let j = 0; j < numObjects; j++) {
          const vel = rb1.getLinearVelocity()
          const angVel = rb1.getAngularVelocity()
          const fragment = debris[j] as ExtendedMesh
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
        const obj0 = this.rigidBodies.find(obj => obj.uuid === split[0])
        const obj1 = this.rigidBodies.find(obj => obj.uuid === split[1])
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
      collider: (object1: ExtendedMesh, object2: ExtendedMesh, eventCallback: (event: Types.CollisionEvent) => void) =>
        this.collisionEvents.addCollider(object1, object2, eventCallback),
      constraints: this.constraints.addConstraints,
      existing: (object: ExtendedMesh | ExtendedGroup, config?: Types.AddExistingConfig) =>
        this.addExisting(object, config),
      plane: (planeConfig: Types.PlaneConfig = {}, materialConfig: Types.MaterialConfig = {}) =>
        this.shapes.addPlane(planeConfig, materialConfig),
      sphere: (sphereConfig: Types.SphereConfig = {}, materialConfig: Types.MaterialConfig = {}) =>
        this.shapes.addSphere(sphereConfig, materialConfig),
      ground: (groundConfig: Types.GroundConfig = {}, materialConfig: Types.MaterialConfig = {}) =>
        this.shapes.addGround(groundConfig, materialConfig),
      box: (boxConfig: Types.BoxConfig = {}, materialConfig: Types.MaterialConfig = {}) =>
        this.shapes.addBox(boxConfig, materialConfig),
      capsule: (capsuleConfig: Types.CapsuleConfig = {}, materialConfig: Types.MaterialConfig = {}) =>
        this.shapes.addCapsule(capsuleConfig, materialConfig),
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

  private prepareThreeObjectForCollisionShape(
    object: ExtendedMesh | ExtendedGroup,
    config: Types.AddExistingConfig = {}
  ) {
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
    const type = object.isMesh ? object.geometry?.type : 'unknown'
    if (/box/i.test(type)) shape = 'box'
    else if (/cone/i.test(type)) shape = 'cone'
    else if (/cylinder/i.test(type)) shape = 'cylinder'
    else if (/extrude/i.test(type)) shape = 'extrude'
    else if (/plane/i.test(type)) shape = 'plane'
    else if (/sphere/i.test(type)) shape = 'sphere'
    else if (/torus/i.test(type)) shape = 'torus'

    // @ts-expect-error: Looks like a three.js type error.
    let params: Partial<typeof defaultParams> = { ...defaultParams, ...object?.geometry?.parameters }

    if (config.shape) {
      params = { ...defaultParams, ...config }
      shape = config.shape
    } else if (object.shape) {
      shape = object.shape
    }

    // Add all default params if undefined
    ;(Object.keys(params) as (keyof typeof defaultParams)[]).forEach(key => {
      if (typeof params[key] === 'undefined' && defaultParams[key]) {
        params[key] = defaultParams[key]
      }
    })

    // auto adjust the center for custom shapes
    if (autoCenter) {
      // mesh
      if (object.isMesh && object.geometry) {
        object.geometry.center()
      }
      // group
      else if (object.isGroup) {
        const box = new Box3()
        const center = new Vector3()
        box.setFromObject(object).getCenter(center)

        object.traverse((child: unknown) => {
          if ((child as ExtendedMesh).isMesh) {
            ;(child as ExtendedMesh).geometry.translate(-center.x, -center.y, -center.z)
          }
        })
      }
    }

    // adjust the cylinder radius for its physcis body
    if (shape === 'cylinder') params.radius = config.radius || params.radiusTop

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

  // prepare data to pass to three-to-ammo.js
  extractData = (object: any) => {
    console.log('extract dat')

    const matrixWorld = new Matrix4().elements
    const vertices: any[] = []
    const matrices: any[] = []
    const indexes: any[] = []
    iterateGeometries(object, {}, (vertexArray: any, matrixArray: any, indexArray: any) => {
      vertices.push(vertexArray)
      matrices.push(matrixArray)
      indexes.push(indexArray)
    })

    return { vertices, matrices, indexes, matrixWorld }
  }

  public createCollisionShape(
    shape: string,
    params: any,
    object?: ExtendedMesh | ExtendedGroup
  ): Ammo.btCollisionShape {
    const quat = object?.quaternion ? object?.quaternion : new Quaternion(0, 0, 0, 1)
    const { axis = 'y' } = params

    // some aliases
    if (shape === 'extrude') shape = 'hacd'
    if (shape === 'mesh' || shape === 'convex') shape = 'convexMesh'
    if (shape === 'concave') shape = 'concaveMesh'

    const btHalfExtents = new Ammo.btVector3()

    // transform geometry to bufferGeometry (because three-to-ammo works only with bufferGeometry)
    // @ts-expect-error: Looks like a three.js type error.
    const geometry = object?.geometry as Geometry
    if (object && geometry?.isGeometry) {
      // @ts-expect-error: fromGeometry() is deprecated and removed from the three.js types.
      object.geometry = new BufferGeometry().fromGeometry(geometry)
    }

    let d = {} as any
    // extract data for complex shapes generated with three-to-ammo.js
    if (this.complexShapes.indexOf(shape) !== -1) d = this.extractData(object)

    let collisionShape
    switch (shape) {
      case 'box':
        btHalfExtents.setValue(params.width / 2, params.height / 2, params.depth / 2)
        collisionShape = new Ammo.btBoxShape(btHalfExtents)
        break
      case 'sphere':
        collisionShape = new Ammo.btSphereShape(params.radius)
        break
      case 'cylinder':
        switch (axis) {
          case 'y':
            btHalfExtents.setValue(params.radius, params.height / 2, params.radius)
            collisionShape = new Ammo.btCylinderShape(btHalfExtents)
            break
          case 'x':
            btHalfExtents.setValue(params.height / 2, params.radius, params.radius)
            collisionShape = new Ammo.btCylinderShapeX(btHalfExtents)
            break
          case 'z':
            btHalfExtents.setValue(params.radius, params.radius, params.height / 2)
            collisionShape = new Ammo.btCylinderShapeZ(btHalfExtents)
            break
        }
        break
      case 'cone':
        switch (axis) {
          case 'y':
            collisionShape = new Ammo.btConeShape(params.radius, params.height)
            break
          case 'x':
            collisionShape = new Ammo.btConeShapeX(params.radius, params.height)
            break
          case 'z':
            collisionShape = new Ammo.btConeShapeZ(params.radius, params.height)
            break
        }
        break
      case 'capsule':
        switch (axis) {
          case 'y':
            collisionShape = new Ammo.btCapsuleShape(params.radius, params.height)
            break
          case 'x':
            collisionShape = new Ammo.btCapsuleShapeX(params.radius, params.height)
            break
          case 'z':
            collisionShape = new Ammo.btCapsuleShapeZ(params.radius, params.height)
            break
        }
        break
      case 'torus':
        collisionShape = createTorusShape(params, quat)
        break
      case 'plane':
        // uses a triMeshShape for the plane
        collisionShape = createTriMeshShape(d.vertices, d.matrices, d.indexes, d.matrixWorld, {
          ...params,
          concave: false
        })
        break
      case 'hull':
        collisionShape = createHullShape(d.vertices, d.matrices, d.matrixWorld, params)
        break
      case 'hacd':
        collisionShape = createHACDShapes(d.vertices, d.matrices, d.indexes, d.matrixWorld, params)
        break
      case 'vhacd':
        collisionShape = createVHACDShapes(d.vertices, d.matrices, d.indexes, d.matrixWorld, params)
        break
      case 'convexMesh':
        collisionShape = createTriMeshShape(d.vertices, d.matrices, d.indexes, d.matrixWorld, {
          ...params,
          concave: false
        })
        break
      case 'concaveMesh':
        collisionShape = createTriMeshShape(d.vertices, d.matrices, d.indexes, d.matrixWorld, {
          ...params,
          concave: true
        })
        break
    }

    Ammo.destroy(btHalfExtents)

    // if there is a x, y or z, take is as temporary offset parameter
    const { x, y, z } = params
    if (x || y || z) {
      collisionShape._compoundOffset = { x: x || 0, y: y || 0, z: z || 0 }
    }

    // in some cases, like hacd, it will be an array of shapes
    // so we merge them
    if (Array.isArray(collisionShape)) collisionShape = this.mergeCollisionShapesToCompoundShape(collisionShape)

    return collisionShape as Ammo.btCollisionShape
  }

  public mergeCollisionShapesToCompoundShape(collisionShapes: Ammo.btCollisionShape[]): Ammo.btCompoundShape {
    const compoundShape = new Ammo.btCompoundShape()
    collisionShapes.forEach(shape => {
      // @ts-expect-error: I use some custom properties here.
      const { _childOffset, _compoundOffset } = shape

      if (_childOffset) {
        const { pos, quat, scale, margin } = _childOffset
        const transform = this.applyPosQuatScaleMargin(shape, pos, quat, scale, margin)
        compoundShape.addChildShape(transform, shape)
      } else if (_compoundOffset) {
        const transform = new Ammo.btTransform()
        transform.setIdentity()
        transform.setOrigin(new Ammo.btVector3(_compoundOffset.x, _compoundOffset.y, _compoundOffset.z))
        compoundShape.addChildShape(transform, shape)
      } else {
        const transform = new Ammo.btTransform()
        transform.setIdentity()
        compoundShape.addChildShape(transform, shape)
      }
    })
    return compoundShape
  }

  protected addExisting(object: ExtendedMesh | ExtendedGroup, config: Types.AddExistingConfig = {}): any {
    const { hasBody } = object
    if (hasBody) {
      logger(`Object "${object.name}" already has a physical body!`)
      return
    }

    const pos = new Vector3()
    const quat = new Quaternion()
    const scale = new Vector3()
    object.getWorldPosition(pos)
    object.getWorldQuaternion(quat)
    object.getWorldScale(scale)

    const isStaticObject = (config.collisionFlags || 0) & 1
    const isKinematicObject = (config.collisionFlags || 0) & 2
    const isDynamicObject = !isStaticObject && !isKinematicObject
    const isGhostObject = (config.collisionFlags || 0) & 4

    // add default materials
    if (object instanceof Group) {
      object.traverse(child => {
        if (
          child instanceof Mesh &&
          child.material instanceof MeshStandardMaterial &&
          child.material?.userData?.defaultMaterial === true
        ) {
          child.material = isStaticObject
            ? this.defaultMaterial.getStatic()
            : isKinematicObject
              ? this.defaultMaterial.getKinematic()
              : this.defaultMaterial.getDynamic()
          child.material.needsUpdate = true
        }
      })
    } else if (
      object instanceof Mesh &&
      object.material instanceof MeshStandardMaterial &&
      object.material?.userData?.defaultMaterial === true
    ) {
      object.material = isStaticObject
        ? this.defaultMaterial.getStatic()
        : isKinematicObject
          ? this.defaultMaterial.getKinematic()
          : this.defaultMaterial.getDynamic()
      object.material.needsUpdate = true
    }

    const {
      shape = 'unknown',
      compound = [],
      mass = isStaticObject || isKinematicObject ? 0 : 1, // set default mass of 0 for static objects, and 1 for all other objects
      collisionFlags = 0,
      collisionGroup = 1,
      collisionMask = -1,
      offset = undefined,
      breakable = false,
      addChildren = true,
      margin = 0.01,
      ignoreScale = false,
      fractureImpulse = 1
    } = config

    if (ignoreScale) scale.set(1, 1, 1)

    if (compound.length >= 1) {
      // if we want a custom compound shape, we simply do
      const collisionShapes = compound.map((s: any) => this.createCollisionShape(s.shape, s))
      const compoundShape = this.mergeCollisionShapesToCompoundShape(collisionShapes)
      const localTransform = this.applyPosQuatScaleMargin(compoundShape, pos, quat, scale, margin)
      const rigidBody = this.collisionShapeToRigidBody(compoundShape, localTransform, mass, isKinematicObject)
      this.addRigidBodyToWorld(object, rigidBody, collisionFlags, collisionGroup, collisionMask, offset)
      object.body.breakable = breakable
      object.body.fractureImpulse = fractureImpulse
      object.body.ignoreScale = ignoreScale
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

          // the relative pos, quat and scale to its parent
          // @ts-expect-error: _childOffset is a custom property.
          cs._childOffset = {
            pos: child.position.clone(),
            quat: child.quaternion.clone(),
            scale: child.scale.clone(),
            margin: margin
          }

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

    const localTransform = this.applyPosQuatScaleMargin(collisionShape, pos, quat, scale, margin)
    const rigidBody = this.collisionShapeToRigidBody(collisionShape, localTransform, mass, isKinematicObject)

    this.addRigidBodyToWorld(object, rigidBody, collisionFlags, collisionGroup, collisionMask, offset)
    object.body.breakable = breakable
    object.body.fractureImpulse = fractureImpulse
    object.body.ignoreScale = ignoreScale
  }

  public addRigidBodyToWorld(
    object: ExtendedMesh | ExtendedGroup,
    rigidBody: Ammo.btRigidBody,
    collisionFlags = 0,
    collisionGroup = 1,
    collisionMask = -1,
    offset?: { x?: number; y?: number; z?: number }
  ) {
    this.rigidBodies.push(object)
    this.physicsWorld.addRigidBody(rigidBody, collisionGroup, collisionMask)

    const ptr = Object.values(rigidBody)[0]
    if (!object.name) object.name = `object-${object.id}`
    // @ts-expect-error: Ammo.btRigidBody has no name property.
    rigidBody.name = object.name
    object.body = new PhysicsBody(this, rigidBody)
    object.hasBody = true
    object.ptr = ptr
    // @ts-expect-error: threeObject is an custom property.
    rigidBody.threeObject = object

    if (offset) object.body.offset = { x: 0, y: 0, z: 0, ...offset }

    object.body.setCollisionFlags(collisionFlags)
  }

  public applyPosQuatScaleMargin(
    collisionShape: Ammo.btCollisionShape,
    pos: Vector3 = new Vector3(1, 1, 1),
    quat: Quaternion = new Quaternion(0, 0, 0, 1),
    scale: Vector3 = new Vector3(1, 1, 1),
    margin: number = 0.01
  ) {
    collisionShape.setMargin(margin)

    const rotation = new Ammo.btQuaternion(0, 0, 0, 1)
    rotation.setValue(quat.x, quat.y, quat.z, quat.w)

    const localTransform = new Ammo.btTransform()
    localTransform.setIdentity()
    localTransform.getOrigin().setValue(pos.x, pos.y, pos.z)
    localTransform.setRotation(rotation)

    Ammo.destroy(rotation)

    const localScale = new Ammo.btVector3(scale.x, scale.y, scale.z)
    collisionShape.setLocalScaling(localScale)
    Ammo.destroy(localScale)

    return localTransform
  }

  public collisionShapeToRigidBody(
    collisionShape: Ammo.btCollisionShape,
    localTransform: Ammo.btTransform,
    mass: number,
    disableDeactivation: boolean
  ) {
    const motionState = new Ammo.btDefaultMotionState(localTransform)
    const localInertia = new Ammo.btVector3(0, 0, 0)
    if (mass > 0) collisionShape.calculateLocalInertia(mass, localInertia)
    const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, collisionShape, localInertia)
    const rigidBody = new Ammo.btRigidBody(rbInfo)
    if (mass > 0 || disableDeactivation) rigidBody.setActivationState(4) // Disable deactivation
    return rigidBody
  }
}

export { AmmoPhysics }
