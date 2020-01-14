/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2019 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { Scene3D } from '..'
import DebugDrawer from './debugDrawer'
import EventEmitter from 'eventemitter3'
import ThreeGraphics from '../threeWrapper'
import { ExtendedObject3D } from '../types'
import { Vector3, MeshLambertMaterial } from 'three'
import { ConvexObjectBreaker } from 'three/examples/jsm/misc/ConvexObjectBreaker'

class Physics extends EventEmitter {
  public tmpTrans: Ammo.btTransform
  public physicsWorld: Ammo.btDiscreteDynamicsWorld
  protected dispatcher: Ammo.btCollisionDispatcher
  protected rigidBodies: ExtendedObject3D[] = []
  protected objectsAmmo: { [ptr: number]: any } = {}
  protected earlierDetectedCollisions: { combinedName: string; collision: boolean }[] = []
  protected debugDrawer: DebugDrawer
  private convexBreaker: ConvexObjectBreaker
  protected addRigidBody: (threeObject: ExtendedObject3D, physicsShape: any, mass: any, pos: any, quat: any) => void
  private objectsToRemove: any[]
  private numObjectsToRemove: number

  constructor(protected phaser3D: ThreeGraphics, protected scene: Scene3D) {
    super()
  }

  protected setup() {
    // Initialize convexBreaker
    this.convexBreaker = new ConvexObjectBreaker()

    this.objectsToRemove = []
    this.numObjectsToRemove = 0
    for (var i = 0; i < 500; i++) {
      this.objectsToRemove[i] = null
    }

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

  public updateDebugger() {
    if (this.debugDrawer && this.debugDrawer.enabled) this.debugDrawer.update()
  }

  protected setupPhysicsWorld() {
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

  private createDebrisFromBreakableObject(object: ExtendedObject3D, parent: ExtendedObject3D) {
    object.material = new MeshLambertMaterial({ color: 0xcccccc })
    object.shape = 'hull'
    object.breakable = false
    object.fragmentDepth = parent.fragmentDepth + 1

    // make this fragment breakable in 2.5seconds
    setTimeout(() => {
      object.breakable = true
    }, 2500)

    // Add the object to the scene
    this.phaser3D.scene.add(object)

    // Add physics to the object
    // @ts-ignore
    this.addExisting(object)
  }

  private removeDebris(object: any) {
    this.phaser3D.scene.remove(object)
    this.physicsWorld.removeRigidBody(object.body.ammo)
    delete this.objectsAmmo[object.ptr]
  }

  public update(delta: number) {
    const impactPoint = new Vector3()
    const impactNormal = new Vector3()
    const detectedCollisions: { combinedName: string; collision: boolean }[] = []

    // Step world
    const deltaTime = delta / 1000
    this.physicsWorld.stepSimulation(deltaTime)

    /**
     * Update rigid bodies
     */
    for (var i = 0, il = this.rigidBodies.length; i < il; i++) {
      var objThree = this.rigidBodies[i]
      var objPhys = objThree.body.ammo
      var ms = objPhys.getMotionState()

      if (ms) {
        ms.getWorldTransform(this.tmpTrans)
        var p = this.tmpTrans.getOrigin()
        var q = this.tmpTrans.getRotation()
        // body offset
        let o = objThree.body.offset
        objThree.position.set(p.x() + o.x, p.y() + o.y, p.z() + o.z)
        objThree.quaternion.set(q.x(), q.y(), q.z(), q.w())

        objThree.collided = false
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

      // do not check collision for 2 unnamed objects
      // (fragments do not have a name, for example)
      if (body0.name === '' && body1.name === '') continue

      // @ts-ignore
      const ptr0 = body0[key]
      // @ts-ignore
      const ptr1 = body1[key]
      const threeObject0 = this.objectsAmmo[ptr0]
      const threeObject1 = this.objectsAmmo[ptr1]

      if (!threeObject0 && !threeObject1) {
        continue
      }

      /**
       * Handle collision events
       */
      // check if a collision between these object has already been processed
      const combinedName = `${threeObject0.name}__${threeObject1.name}`
      let event
      if (this.earlierDetectedCollisions.find(el => el.combinedName === combinedName)) event = 'colliding'
      else event = 'start'
      detectedCollisions.push({ combinedName, collision: true })
      this.emit('collision', { bodies: [threeObject0, threeObject1], event })

      /**
       * Get some information
       */
      const breakable0 = threeObject0.breakable
      const breakable1 = threeObject1.breakable

      const collided0 = threeObject0.collided
      const collided1 = threeObject1.collided

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
            impactPoint.set(pos.x(), pos.y(), pos.z())
            impactNormal.set(normal.x(), normal.y(), normal.z())
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
      const emptyV3 = new Vector3(0, 0, 0)
      threeObject0.userData = {
        mass: 1,
        velocity: emptyV3,
        angularVelocity: emptyV3,
        breakable: breakable0,
        physicsBody: body0
      }
      threeObject1.userData = {
        mass: 1,
        velocity: emptyV3,
        angularVelocity: emptyV3,
        breakable: breakable1,
        physicsBody: body1
      }
      if (typeof threeObject0.fragmentDepth === 'undefined') threeObject0.fragmentDepth = 0
      if (typeof threeObject1.fragmentDepth === 'undefined') threeObject1.fragmentDepth = 0

      // threeObject0
      if (breakable0 && !collided0 && maxImpulse > fractureImpulse && threeObject0.fragmentDepth < MAX_FRAGMENT_DEPTH) {
        var debris = this.convexBreaker.subdivideByImpact(threeObject0, impactPoint, impactNormal, 1, 2) //, 1.5)

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
        threeObject0.collided = true
      }

      // threeObject1
      if (breakable1 && !collided1 && maxImpulse > fractureImpulse && threeObject1.fragmentDepth < MAX_FRAGMENT_DEPTH) {
        var debris = this.convexBreaker.subdivideByImpact(threeObject1, impactPoint, impactNormal, 1, 2) //, 1.5)

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
        threeObject1.collided = true
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
