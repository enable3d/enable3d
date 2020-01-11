/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2019 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import AmmoPhysics from '.'
import { ExtendedObject3D } from '../types'
import Physics from './physics'

class PhysicsBody {
  offset = { x: 0, y: 0, z: 0 }
  name: string
  constructor(private physics: Physics, public ammo: Ammo.btRigidBody) {
    // @ts-ignore
    this.name = ammo.name
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
    this.ammo.setLinearVelocity(new Ammo.btVector3(x, y, z))
  }
  public setVelocityX(value: number) {
    this.ammo.setLinearVelocity(new Ammo.btVector3(value, this.velocity.y, this.velocity.z))
  }
  public setVelocityY(value: number) {
    this.ammo.setLinearVelocity(new Ammo.btVector3(this.velocity.x, value, this.velocity.z))
  }
  public setVelocityZ(value: number) {
    this.ammo.setLinearVelocity(new Ammo.btVector3(this.velocity.x, this.velocity.y, value))
  }

  public setAngularVelocity(x: number, y: number, z: number) {
    this.ammo.setAngularVelocity(new Ammo.btVector3(x, y, z))
  }
  public setAngularVelocityX(value: number) {
    this.ammo.setAngularVelocity(new Ammo.btVector3(value, this.angularVelocity.y, this.angularVelocity.z))
  }
  public setAngularVelocityY(value: number) {
    this.ammo.setAngularVelocity(new Ammo.btVector3(this.angularVelocity.x, value, this.angularVelocity.z))
  }
  public setAngularVelocityZ(value: number) {
    this.ammo.setAngularVelocity(new Ammo.btVector3(this.angularVelocity.x, this.angularVelocity.y, value))
  }

  public applyForce(x: number, y: number, z: number) {
    this.ammo.applyCentralImpulse(new Ammo.btVector3(x, y, z))
  }
  public applyForceX(value: number) {
    this.ammo.applyCentralImpulse(new Ammo.btVector3(value, 0, 0))
  }
  public applyForceY(value: number) {
    this.ammo.applyCentralImpulse(new Ammo.btVector3(0, value, 0))
  }
  public applyForceZ(value: number) {
    this.ammo.applyCentralImpulse(new Ammo.btVector3(0, 0, value))
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
    this.ammo.getCollisionFlags()
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
    this.ammo.setLinearFactor(new Ammo.btVector3(x, y, z))
  }
  public setAngularFactor(x: number, y: number, z: number) {
    this.ammo.setAngularFactor(new Ammo.btVector3(x, y, z))
  }

  public setFriction(value: number) {
    this.ammo.setFriction(value)
  }
}

export default PhysicsBody
