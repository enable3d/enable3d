/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import DebugDrawer from './debugDrawer'
import EventEmitter from 'eventemitter3'
import { ExtendedObject3D, Phaser3DConfig } from '@enable3d/common/dist/types'
import { Vector3, Scene, Quaternion, Euler } from '@enable3d/three-wrapper/dist/index'
import { ConvexObjectBreaker } from './convexObjectBreaker'
import DefaultMaterial from '@enable3d/common/dist/defaultMaterial'

class Physics extends EventEmitter {
  public tmpTrans: Ammo.btTransform
  public physicsWorld: Ammo.btDiscreteDynamicsWorld
  protected dispatcher: Ammo.btCollisionDispatcher
  protected rigidBodies: ExtendedObject3D[] = []
  protected objectsAmmo: { [ptr: number]: any } = {}
  protected earlierDetectedCollisions: { combinedName: string; collision: boolean }[] = []
  protected debugDrawer: DebugDrawer
  private convexBreaker: any
  protected addRigidBody: (threeObject: ExtendedObject3D, physicsShape: any, mass: any, pos: any, quat: any) => void
  private objectsToRemove: any[]
  private numObjectsToRemove: number
  protected gravity: { x: number; y: number; z: number }

  protected emptyV3: Vector3
  protected impactPoint: Vector3
  protected impactNormal: Vector3

  protected tmpEuler: Euler
  protected tmpQuaternion: Quaternion
  protected tmpVector3: Vector3
  protected tmpBtVector3: Ammo.btVector3
  protected tmpBtQuaternion: Ammo.btQuaternion

  protected defaultMaterial: DefaultMaterial

  constructor(protected scene: Scene, public config: Phaser3DConfig = {}) {
    super()
  }

  protected setup() {
    // Initialize convexBreaker
    // @ts-ignore
    this.convexBreaker = new ConvexObjectBreaker()

    this.objectsToRemove = []
    this.numObjectsToRemove = 0
    for (var i = 0; i < 500; i++) {
      this.objectsToRemove[i] = null
    }

    // setup ammo physics
    this.setupPhysicsWorld()

    this.debugDrawer = new DebugDrawer(this.scene, this.physicsWorld, {})

    /**
     * TODO add ghost object
     */
    // const ghost = new Ammo.btGhostObject()
    // ghost.setCollisionShape(new Ammo.btSphereShape(10))
    // ghost.setWorldTransform(new Ammo.btTransform(new Ammo.btQuaternion(0, 0, 0, 1), new Ammo.btVector3(0, 15, 0)))
    // ghost.setCollisionFlags(4)
    // this.physicsWorld.addCollisionObject(ghost)

    // run the phaser update method
    /*if (!this.phaser3D.isXrEnabled)
      this.scene.events.on('update', (_time: number, delta: number) => {
        this.update(delta)
        this.updateDebugger()
      })*/
  }

  public updateDebugger() {
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
    this.physicsWorld.stepSimulation(deltaTime, this.config.maxSubSteps || 1, this.config.fixedTimeStep || 1 / 60)

    /**
     * Update rigid bodies
     */
    for (var i = 0, il = this.rigidBodies.length; i < il; i++) {
      var objThree = this.rigidBodies[i]
      var objPhys = objThree.body.ammo
      var ms = objPhys.getMotionState()

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

        objThree.body.collided = false
      }
    }

    /**
     * Check collisions
     */
    for (var i = 0, il = this.dispatcher.getNumManifolds(); i < il; i++) {
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

      const collided0 = threeObject0.body.collided
      const collided1 = threeObject1.body.collided

      const checkCollisions0 = threeObject0.body?.checkCollisions
      const checkCollisions1 = threeObject1.body?.checkCollisions

      /**
       * Handle collision events
       */
      if (checkCollisions0 || checkCollisions1) {
        // check if a collision between these object has already been processed
        const names = [threeObject0.name, threeObject1.name].sort()
        const combinedName = `${names[0]}__${names[1]}`
        let event
        if (this.earlierDetectedCollisions.find(el => el.combinedName === combinedName)) event = 'colliding'
        else event = 'start'
        detectedCollisions.push({ combinedName, collision: true })
        this.emit('collision', { bodies: [threeObject0, threeObject1], event })
      }

      if ((!breakable0 && !breakable1) || (collided0 && collided1)) {
        continue
      }

      let contact = false
      let maxImpulse = 0
      for (var j = 0, jl = contactManifold.getNumContacts(); j < jl; j++) {
        var contactPoint = contactManifold.getContactPoint(j)

        if (contactPoint.getDistance() < 0) {
          contact = true
          var impulse = contactPoint.getAppliedImpulse()

          if (impulse > maxImpulse) {
            maxImpulse = impulse
            var pos = contactPoint.get_m_positionWorldOnB()
            var normal = contactPoint.get_m_normalWorldOnB()
            this.impactPoint.set(pos.x(), pos.y(), pos.z())
            this.impactNormal.set(normal.x(), normal.y(), normal.z())
          }

          break
        }
      }

      // If no point has contact, abort
      if (!contact) continue

      /**
       * Check for breakable objects (subdivision)
       */
      const fractureImpulse = 5 //250
      const MAX_FRAGMENT_DEPTH = 2

      // since the library convexBreaker makes use of three's userData
      // we have to clone the necessary params to threeObjectX.userData
      // TODO improve this

      this.emptyV3.set(0, 0, 0)
      threeObject0.userData = {
        mass: 1,
        velocity: this.emptyV3,
        angularVelocity: this.emptyV3,
        breakable: breakable0,
        physicsBody: body0
      }
      threeObject1.userData = {
        mass: 1,
        velocity: this.emptyV3,
        angularVelocity: this.emptyV3,
        breakable: breakable1,
        physicsBody: body1
      }
      if (typeof threeObject0.fragmentDepth === 'undefined') threeObject0.fragmentDepth = 0
      if (typeof threeObject1.fragmentDepth === 'undefined') threeObject1.fragmentDepth = 0

      // threeObject0
      if (breakable0 && !collided0 && maxImpulse > fractureImpulse && threeObject0.fragmentDepth < MAX_FRAGMENT_DEPTH) {
        var debris = this.convexBreaker.subdivideByImpact(threeObject0, this.impactPoint, this.impactNormal, 1, 2) //, 1.5)

        var numObjects = debris.length
        for (var j = 0; j < numObjects; j++) {
          var vel = body0.getLinearVelocity()
          var angVel = body0.getAngularVelocity()
          var fragment = debris[j] as ExtendedObject3D
          fragment.userData.velocity.set(vel.x(), vel.y(), vel.z())
          fragment.userData.angularVelocity.set(angVel.x(), angVel.y(), angVel.z())

          this.createDebrisFromBreakableObject(fragment, threeObject0)
        }

        this.objectsToRemove[this.numObjectsToRemove++] = threeObject0
        threeObject0.body.collided = true
      }

      // threeObject1
      if (breakable1 && !collided1 && maxImpulse > fractureImpulse && threeObject1.fragmentDepth < MAX_FRAGMENT_DEPTH) {
        var debris = this.convexBreaker.subdivideByImpact(threeObject1, this.impactPoint, this.impactNormal, 1, 2) //, 1.5)

        var numObjects = debris.length
        for (var j = 0; j < numObjects; j++) {
          var vel = body1.getLinearVelocity()
          var angVel = body1.getAngularVelocity()
          var fragment = debris[j] as ExtendedObject3D
          fragment.userData.velocity.set(vel.x(), vel.y(), vel.z())
          fragment.userData.angularVelocity.set(angVel.x(), angVel.y(), angVel.z())

          this.createDebrisFromBreakableObject(fragment, threeObject1)
        }

        this.objectsToRemove[this.numObjectsToRemove++] = threeObject1
        threeObject1.body.collided = true
      }
    }

    /**
     * Remove objects
     */
    for (var i = 0; i < this.numObjectsToRemove; i++) {
      this.removeDebris(this.objectsToRemove[i])
    }
    this.numObjectsToRemove = 0

    /**
     * Handle collision end events
     */
    this.earlierDetectedCollisions.forEach(el => {
      const { combinedName } = el
      if (!detectedCollisions.find(el => el.combinedName === combinedName)) {
        const split = combinedName.split('__')
        const obj0 = this.rigidBodies.find(obj => obj.name === split[0])
        const obj1 = this.rigidBodies.find(obj => obj.name === split[1])
        if (obj0 && obj1) this.emit('collision', { bodies: [obj0, obj1], event: 'end' })
      }
    })
    this.earlierDetectedCollisions = [...detectedCollisions]
  }
}

export default Physics
