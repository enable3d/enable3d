/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2019 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import AmmoPhysics from './ammoPhysics'
import { ExtendedObject3D } from '../types'

class PhysicsBody {
  offset = { x: 0, y: 0, z: 0 }
  name: string
  constructor(private ammoPhysics: AmmoPhysics, public ammoBody: Ammo.btRigidBody) {
    // @ts-ignore
    this.name = ammoBody.name
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
    this.ammoPhysics.on('collision', (data: { bodies: ExtendedObject3D[]; event: 'start' | 'collision' | 'end' }) => {
      const { bodies, event } = data
      if (bodies[0].name === this.name) collisionCallback(bodies[1], event)
      else if (bodies[1].name === this.name) collisionCallback(bodies[0], event)
    })
  }

  public get velocity() {
    return {
      x: this.ammoBody.getLinearVelocity().x(),
      y: this.ammoBody.getLinearVelocity().y(),
      z: this.ammoBody.getLinearVelocity().z()
    }
  }

  public get angularVelocity() {
    return {
      x: this.ammoBody.getAngularVelocity().x(),
      y: this.ammoBody.getAngularVelocity().y(),
      z: this.ammoBody.getAngularVelocity().z()
    }
  }

  public setVelocity(x: number, y: number, z: number) {
    this.ammoBody.setLinearVelocity(new Ammo.btVector3(x, y, z))
  }

  public setVelocityX(value: number) {
    this.ammoBody.setLinearVelocity(new Ammo.btVector3(value, this.velocity.y, this.velocity.z))
  }
  public setVelocityY(value: number) {
    this.ammoBody.setLinearVelocity(new Ammo.btVector3(this.velocity.x, value, this.velocity.z))
  }
  public setVelocityZ(value: number) {
    this.ammoBody.setLinearVelocity(new Ammo.btVector3(this.velocity.x, this.velocity.y, value))
  }

  public setAngularVelocityX(value: number) {
    this.ammoBody.setAngularVelocity(new Ammo.btVector3(value, this.angularVelocity.y, this.angularVelocity.z))
  }
  public setAngularVelocityY(value: number) {
    this.ammoBody.setAngularVelocity(new Ammo.btVector3(this.angularVelocity.x, value, this.angularVelocity.z))
  }
  public setAngularVelocityZ(value: number) {
    this.ammoBody.setAngularVelocity(new Ammo.btVector3(this.angularVelocity.x, this.angularVelocity.y, value))
  }

  public applyForce(x: number, y: number, z: number) {
    this.ammoBody.applyCentralImpulse(new Ammo.btVector3(x, y, z))
  }

  public applyForceX(value: number) {
    this.ammoBody.applyCentralImpulse(new Ammo.btVector3(value, 0, 0))
  }

  public applyForceY(value: number) {
    this.ammoBody.applyCentralImpulse(new Ammo.btVector3(0, value, 0))
  }

  public applyForceZ(value: number) {
    this.ammoBody.applyCentralImpulse(new Ammo.btVector3(0, 0, value))
  }

  /**
   * Add the collision flags
   * @param value 0 is DYNAMIC, 1 is STATIC, 2 is KINEMATIC, 4 GHOST
   */
  // https://github.com/bulletphysics/bullet3/blob/aae8048722f2596f7e2bdd52d2a1dcb52a218f2b/src/BulletCollision/CollisionDispatch/btCollisionObject.h#L128
  public setCollisionFlags(value: number) {
    this.ammoBody.setCollisionFlags(value)
  }

  public getCollisionFlags() {
    this.ammoBody.getCollisionFlags()
  }

  /**
   * Set the restitution (bounciness)
   * @param value A number from 0 to 1.
   */
  public setRestitution(value: number) {
    this.ammoBody.setRestitution(value)
  }

  public setAngularFactor(x: number, y: number, z: number) {
    this.ammoBody.setAngularFactor(new Ammo.btVector3(x, y, z))
  }
}

export default PhysicsBody
