/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { ExtendedObject3D, XYZ } from './types'

import { EventEmitter } from 'eventemitter3'
import { Euler, Quaternion } from '@enable3d/three-wrapper/dist/index'
import { CollisionEvent } from './types'

class PhysicsBody {
  public offset = { x: 0, y: 0, z: 0 }
  public name: string
  public errors: string[] = []
  public checkCollisions = false
  public breakable = false
  public didUpdate = false
  /** Skip syncing the mesh to the physics body. */
  public skipUpdate = false

  private _emitUpdateEvents = false
  private _needUpdate = false

  private tmpEuler = new Euler()
  private tmpQuaternion = new Quaternion()

  private tmpBtVector3 = new Ammo.btVector3()
  private tmpBtVector3_1 = new Ammo.btVector3()
  private tmpBtQuaternion = new Ammo.btQuaternion(0, 0, 0, 1)

  private eventEmitter = new EventEmitter()

  constructor(private physics: any, public ammo: Ammo.btRigidBody) {
    // @ts-ignore
    this.name = ammo.name
  }

  /**
   * Don't call this manually! Do physics.destroy() instead.
   */
  public destructor() {
    // remove events
    if (this.eventEmitter) this.eventEmitter.removeAllListeners()

    // destroy tmp ammo values
    Ammo.destroy(this.tmpBtVector3)
    Ammo.destroy(this.tmpBtVector3_1)
    Ammo.destroy(this.tmpBtQuaternion)

    // destory collision shape
    Ammo.destroy(this.ammo.getCollisionShape())

    // destroy body
    Ammo.destroy(this.ammo)
  }

  private setupEventEmitter() {
    if (typeof this.eventEmitter === 'undefined') this.eventEmitter = new EventEmitter()
  }

  public get needUpdate() {
    return this._needUpdate
  }
  public set needUpdate(need: boolean) {
    if (!need && this._needUpdate) this.didUpdate = true
    this._needUpdate = need
  }

  private onUpdateEvent(updateCallback: Function, once: boolean = false) {
    this.setupEventEmitter()
    this._emitUpdateEvents = true
    if (once)
      this.eventEmitter.once('update', () => {
        updateCallback()
      })
    else
      this.eventEmitter.on('update', () => {
        updateCallback()
      })
  }

  public get on() {
    return {
      update: (updateCallback: Function) => this.onUpdateEvent(updateCallback),
      collision: (collisionCallback: (otherObject: ExtendedObject3D, event: CollisionEvent) => void) =>
        this.onCollision(collisionCallback)
    }
  }

  public get once() {
    return {
      update: (updateCallback: Function) => this.onUpdateEvent(updateCallback, true)
    }
  }

  private onCollision(collisionCallback: (otherObject: ExtendedObject3D, event: CollisionEvent) => void) {
    this.checkCollisions = true

    this.physics.collisionEvents.on('collision', (data: { bodies: ExtendedObject3D[]; event: CollisionEvent }) => {
      const { bodies, event } = data
      if (bodies[0].name === this.name) collisionCallback(bodies[1], event)
      else if (bodies[1].name === this.name) collisionCallback(bodies[0], event)
    })
  }

  /** You have to call transform() before you can get or set the body's position or rotation. (for headless mode only) */
  public transform() {
    const t = this.physics.tmpTrans
    this.ammo.getMotionState().getWorldTransform(t)
  }

  /** You have to call refresh() after you set the position or rotation of the body. (for headless mode only) */
  public refresh() {
    const t = this.physics.tmpTrans
    this.ammo.getMotionState().setWorldTransform(t)
  }

  /** Set the rotation in radians. (for headless mode only) */
  public setRotation(x: number, y: number, z: number) {
    const e = this.tmpEuler.set(x, y, z)
    const q = this.tmpQuaternion.set(0, 0, 0, 1)
    q.setFromEuler(e)

    this.tmpBtQuaternion.setValue(0, 0, 0, 1)
    const ammoQuat = this.tmpBtQuaternion
    ammoQuat.setValue(q.x, q.y, q.z, q.w)

    const t = this.physics.tmpTrans
    t.setRotation(ammoQuat)
  }

  /** Get the rotation in radians. (for headless mode only) */
  public get rotation() {
    const t = this.physics.tmpTrans
    const ammoQuat = t.getRotation()
    const q = this.tmpQuaternion.set(ammoQuat.x(), ammoQuat.y(), ammoQuat.z(), ammoQuat.w())

    const qx = q.x
    const qy = q.y
    const qz = q.z
    const qw = q.w

    // https://www.euclideanspace.com/maths/geometry/rotations/conversions/quaternionToAngle/index.htm
    const angle = 2 * Math.acos(qw)
    const x = qx / Math.sqrt(1 - qw * qw)
    const y = qy / Math.sqrt(1 - qw * qw)
    const z = qz / Math.sqrt(1 - qw * qw)

    return { x: x * angle || 0, y: y * angle || 0, z: z * angle || 0 }
  }

  /** Set position. (for headless mode only) */
  public setPosition(x: number, y: number, z: number) {
    const t = this.physics.tmpTrans
    t.getOrigin().setValue(x, y, z)
  }

  /** Get position. (for headless mode only) */
  public get position() {
    const t = this.physics.tmpTrans
    return { x: t.getOrigin().x(), y: t.getOrigin().y(), z: t.getOrigin().z() }
  }

  public get velocity() {
    return {
      x: this.ammo.getLinearVelocity().x(),
      y: this.ammo.getLinearVelocity().y(),
      z: this.ammo.getLinearVelocity().z()
    }
  }

  public get angularVelocity() {
    return {
      x: this.ammo.getAngularVelocity().x(),
      y: this.ammo.getAngularVelocity().y(),
      z: this.ammo.getAngularVelocity().z()
    }
  }

  public setVelocity(x: number, y: number, z: number) {
    this.tmpBtVector3.setValue(x, y, z)
    this.ammo.setLinearVelocity(this.tmpBtVector3)
  }
  public setVelocityX(value: number) {
    this.tmpBtVector3.setValue(value, this.velocity.y, this.velocity.z)
    this.ammo.setLinearVelocity(this.tmpBtVector3)
  }
  public setVelocityY(value: number) {
    this.tmpBtVector3.setValue(this.velocity.x, value, this.velocity.z)
    this.ammo.setLinearVelocity(this.tmpBtVector3)
  }
  public setVelocityZ(value: number) {
    this.tmpBtVector3.setValue(this.velocity.x, this.velocity.y, value)
    this.ammo.setLinearVelocity(this.tmpBtVector3)
  }

  public setAngularVelocity(x: number, y: number, z: number) {
    this.tmpBtVector3.setValue(x, y, z)
    this.ammo.setAngularVelocity(this.tmpBtVector3)
  }
  public setAngularVelocityX(value: number) {
    this.tmpBtVector3.setValue(value, this.angularVelocity.y, this.angularVelocity.z)
    this.ammo.setAngularVelocity(this.tmpBtVector3)
  }
  public setAngularVelocityY(value: number) {
    this.tmpBtVector3.setValue(this.angularVelocity.x, value, this.angularVelocity.z)
    this.ammo.setAngularVelocity(this.tmpBtVector3)
  }
  public setAngularVelocityZ(value: number) {
    this.tmpBtVector3.setValue(this.angularVelocity.x, this.angularVelocity.y, value)
    this.ammo.setAngularVelocity(this.tmpBtVector3)
  }

  // Apply Force methods
  public applyForce(x: number, y: number, z: number) {
    this.tmpBtVector3.setValue(x, y, z)
    this.ammo.applyCentralImpulse(this.tmpBtVector3)
  }
  public applyForceX(value: number) {
    this.tmpBtVector3.setValue(value, 0, 0)
    this.ammo.applyCentralImpulse(this.tmpBtVector3)
  }
  public applyForceY(value: number) {
    this.tmpBtVector3.setValue(0, value, 0)
    this.ammo.applyCentralImpulse(this.tmpBtVector3)
  }
  public applyForceZ(value: number) {
    this.tmpBtVector3.setValue(0, 0, value)
    this.ammo.applyCentralImpulse(this.tmpBtVector3)
  }

  // Apply "Something" Methods
  public applyCentralForce(x: number, y: number, z: number) {
    this.tmpBtVector3.setValue(x, y, z)
    this.ammo.applyCentralForce(this.tmpBtVector3)
  }
  public applyCentralImpulse(x: number, y: number, z: number) {
    this.tmpBtVector3.setValue(x, y, z)
    this.ammo.applyCentralImpulse(this.tmpBtVector3)
  }
  public applyCentralLocalForce(x: number, y: number, z: number) {
    this.tmpBtVector3.setValue(x, y, z)
    this.ammo.applyCentralLocalForce(this.tmpBtVector3)
  }
  public applyImpulse(impulse: XYZ, relativePosition: XYZ) {
    this.tmpBtVector3.setValue(impulse.x || 0, impulse.y || 0, impulse.z || 0)
    this.tmpBtVector3_1.setValue(relativePosition.x || 0, relativePosition.y || 0, relativePosition.z || 0)
    this.ammo.applyImpulse(this.tmpBtVector3, this.tmpBtVector3_1)
  }
  public applyLocalTorque(x: number, y: number, z: number) {
    this.tmpBtVector3.setValue(x, y, z)
    this.ammo.applyLocalTorque(this.tmpBtVector3)
  }
  public applyTorque(x: number, y: number, z: number) {
    this.tmpBtVector3.setValue(x, y, z)
    this.ammo.applyTorque(this.tmpBtVector3)
  }
  public applyTorqueImpulse(x: number, y: number, z: number) {
    this.tmpBtVector3.setValue(x, y, z)
    this.ammo.applyTorqueImpulse(this.tmpBtVector3)
  }

  /**
   * Add the collision flags
   * @param value 0 is DYNAMIC, 1 is STATIC, 2 is KINEMATIC, 4 GHOST
   */
  // https://github.com/bulletphysics/bullet3/blob/aae8048722f2596f7e2bdd52d2a1dcb52a218f2b/src/BulletCollision/CollisionDispatch/btCollisionObject.h#L128
  public setCollisionFlags(value: number) {
    this.ammo.setCollisionFlags(value)
  }
  /**
   * Get the collision flags
   * @param value 0 is DYNAMIC, 1 is STATIC, 2 is KINEMATIC, 4 GHOST
   */
  public getCollisionFlags() {
    return this.ammo.getCollisionFlags()
  }

  /**
   * Set the restitution (same as bounciness)
   * @param value A number from 0 to 1.
   */
  public setRestitution(value: number) {
    this.ammo.setRestitution(value)
  }
  /**
   * Set the bounciness (same as restitution)
   * @param value A number from 0 to 1.
   */
  public setBounciness(value: number) {
    this.setRestitution(value)
  }

  /**
   * Set the friction
   * @param value A number from 0 to 1.
   */
  public setFriction(value: number) {
    this.ammo.setFriction(value)
  }

  /** Set per body gravity */
  public setGravity(x: number, y: number, z: number) {
    this.tmpBtVector3.setValue(x, y, z)
    this.ammo.setGravity(this.tmpBtVector3)
  }

  public setLinearFactor(x: number, y: number, z: number) {
    this.tmpBtVector3.setValue(x, y, z)
    this.ammo.setLinearFactor(this.tmpBtVector3)
  }
  public setAngularFactor(x: number, y: number, z: number) {
    this.tmpBtVector3.setValue(x, y, z)
    this.ammo.setAngularFactor(this.tmpBtVector3)
  }

  public setCcdMotionThreshold(threshold: number) {
    this.ammo.setCcdMotionThreshold(threshold)
  }

  public setCcdSweptSphereRadius(radius: number) {
    this.ammo.setCcdSweptSphereRadius(radius)
  }
}

export default PhysicsBody
