/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2019 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import AmmoPhysics from '.'
import { ExtendedObject3D } from '../types'
import { Euler, Quaternion } from 'three'
import logger from '../helpers/logger'

class PhysicsBody {
  public offset = { x: 0, y: 0, z: 0 }
  public name: string
  public errors: string[] = []

  private tmpEuler = new Euler()
  private tmpQuaternion = new Quaternion()
  private tmpBtVector3 = new Ammo.btVector3()
  private tmpBtQuaternion = new Ammo.btQuaternion(0, 0, 0, 1)

  constructor(private physics: AmmoPhysics, public ammo: Ammo.btRigidBody) {
    // @ts-ignore
    this.name = ammo.name
  }

  private error(error: string) {
    if (!this.errors.includes(error)) {
      this.errors.push(error)
      logger(error)
    }
  }

  public get on() {
    return {
      collision: (collisionCallback: (otherObject: ExtendedObject3D, event: 'start' | 'collision' | 'end') => void) =>
        this.onCollision(collisionCallback)
    }
  }

  private onCollision(
    collisionCallback: (otherObject: ExtendedObject3D, event: 'start' | 'collision' | 'end') => void
  ) {
    this.physics.on('collision', (data: { bodies: ExtendedObject3D[]; event: 'start' | 'collision' | 'end' }) => {
      const { bodies, event } = data
      if (bodies[0].name === this.name) collisionCallback(bodies[1], event)
      else if (bodies[1].name === this.name) collisionCallback(bodies[0], event)
    })
  }

  private dynamicCheck() {
    if (this.ammo.isStaticOrKinematicObject()) {
      this.error(`[Body ${this.name}] You only add force or velocity to dynamic bodies.`)
      return false
    }
    return true
  }

  private kinematicCheck() {
    if (!this.ammo.isKinematicObject()) {
      this.error(`[Body ${this.name}] You can only transform kinematic bodies.`)
      return false
    }
    return true
  }

  /** You have to call transform() before you can get or set the body's position or rotation. */
  public transform() {
    const t = this.physics.tmpTrans
    this.ammo.getMotionState().getWorldTransform(t)
  }

  /** You have to call refresh() after you set the position or rotation of the body.  */
  public refresh() {
    if (!this.kinematicCheck()) return

    const t = this.physics.tmpTrans
    this.ammo.getMotionState().setWorldTransform(t)
  }

  /** Set the rotation in radians. */
  public setRotation(x: number, y: number, z: number) {
    if (!this.kinematicCheck()) return

    const e = this.tmpEuler.set(x, y, z)
    const q = this.tmpQuaternion.set(0, 0, 0, 1)
    q.setFromEuler(e)

    this.tmpBtQuaternion.setValue(0, 0, 0, 1)
    const ammoQuat = this.tmpBtQuaternion
    ammoQuat.setValue(q.x, q.y, q.z, q.w)

    const t = this.physics.tmpTrans
    t.setRotation(ammoQuat)
  }

  /** Get the rotation in radians. */
  public getRotation() {
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

  public setPosition(x: number, y: number, z: number) {
    if (!this.kinematicCheck()) return

    const t = this.physics.tmpTrans
    t.getOrigin().setValue(x, y, z)
  }

  public getPosition() {
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
    if (!this.dynamicCheck()) return
    this.tmpBtVector3.setValue(x, y, z)
    this.ammo.setLinearVelocity(this.tmpBtVector3)
  }
  public setVelocityX(value: number) {
    if (!this.dynamicCheck()) return
    this.tmpBtVector3.setValue(value, this.velocity.y, this.velocity.z)
    this.ammo.setLinearVelocity(this.tmpBtVector3)
  }
  public setVelocityY(value: number) {
    if (!this.dynamicCheck()) return
    this.tmpBtVector3.setValue(this.velocity.x, value, this.velocity.z)
    this.ammo.setLinearVelocity(this.tmpBtVector3)
  }
  public setVelocityZ(value: number) {
    if (!this.dynamicCheck()) return
    this.tmpBtVector3.setValue(this.velocity.x, this.velocity.y, value)
    this.ammo.setLinearVelocity(this.tmpBtVector3)
  }

  public setAngularVelocity(x: number, y: number, z: number) {
    if (!this.dynamicCheck()) return
    this.tmpBtVector3.setValue(x, y, z)
    this.ammo.setAngularVelocity(this.tmpBtVector3)
  }
  public setAngularVelocityX(value: number) {
    if (!this.dynamicCheck()) return
    this.tmpBtVector3.setValue(value, this.angularVelocity.y, this.angularVelocity.z)
    this.ammo.setAngularVelocity(this.tmpBtVector3)
  }
  public setAngularVelocityY(value: number) {
    if (!this.dynamicCheck()) return
    this.tmpBtVector3.setValue(this.angularVelocity.x, value, this.angularVelocity.z)
    this.ammo.setAngularVelocity(this.tmpBtVector3)
  }
  public setAngularVelocityZ(value: number) {
    if (!this.dynamicCheck()) return
    this.tmpBtVector3.setValue(this.angularVelocity.x, this.angularVelocity.y, value)
    this.ammo.setAngularVelocity(this.tmpBtVector3)
  }

  public applyForce(x: number, y: number, z: number) {
    if (!this.dynamicCheck()) return
    this.tmpBtVector3.setValue(x, y, z)
    this.ammo.applyCentralImpulse(this.tmpBtVector3)
  }
  public applyForceX(value: number) {
    if (!this.dynamicCheck()) return
    this.tmpBtVector3.setValue(value, 0, 0)
    this.ammo.applyCentralImpulse(this.tmpBtVector3)
  }
  public applyForceY(value: number) {
    if (!this.dynamicCheck()) return
    this.tmpBtVector3.setValue(0, value, 0)
    this.ammo.applyCentralImpulse(this.tmpBtVector3)
  }
  public applyForceZ(value: number) {
    if (!this.dynamicCheck()) return
    this.tmpBtVector3.setValue(0, 0, value)
    this.ammo.applyCentralImpulse(this.tmpBtVector3)
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

  public setLinearFactor(x: number, y: number, z: number) {
    this.tmpBtVector3.setValue(x, y, z)
    this.ammo.setLinearFactor(this.tmpBtVector3)
  }
  public setAngularFactor(x: number, y: number, z: number) {
    this.tmpBtVector3.setValue(x, y, z)
    this.ammo.setAngularFactor(this.tmpBtVector3)
  }

  public setFriction(value: number) {
    this.ammo.setFriction(value)
  }
}

export default PhysicsBody
