/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2019 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

// Inspired by https://github.com/donmccurdy/aframe-physics-system/blob/master/src/components/ammo-constraint.js

import PhysicsBody from './physicsBody'
import { XYZ } from '../types'

export default class Constraints {
  // public tmpTrans: Ammo.btTransform
  protected physicsWorld: Ammo.btDiscreteDynamicsWorld

  constructor() {}
  protected get addConstraints() {
    return {
      lock: (body: PhysicsBody, targetBody: PhysicsBody) => this.lock(body, targetBody),
      fixed: (body: PhysicsBody, targetBody: PhysicsBody) => this.fixed(body, targetBody),
      spring: (
        body: PhysicsBody,
        targetBody: PhysicsBody,
        config: {
          stiffness?: number
          damping?: number
          angularLock?: boolean
        }
      ) => this.spring(body, targetBody, config),
      slider: (body: PhysicsBody, targetBody: PhysicsBody) => this.slider(body, targetBody),
      hinge: (
        body: PhysicsBody,
        targetBody: PhysicsBody,
        config: {
          pivot?: XYZ
          targetPivot?: XYZ
          axis?: XYZ
          targetAxis?: XYZ
        }
      ) => this.hinge(body, targetBody, config),
      coneTwist: (body: PhysicsBody, targetPivot: XYZ) => this.coneTwist(body, targetPivot),
      pointToPoint: (
        body: PhysicsBody,
        targetBody: PhysicsBody,
        config: {
          pivot?: XYZ
          targetPivot?: XYZ
        }
      ) => this.pointToPoint(body, targetBody, config)
    }
  }

  private getTransform(body: Ammo.btRigidBody, targetBody: Ammo.btRigidBody) {
    const bodyTransform = body
      .getCenterOfMassTransform()
      .inverse()
      .op_mul(targetBody.getWorldTransform())
    const targetTransform = new Ammo.btTransform()
    targetTransform.setIdentity()
    return { body: bodyTransform, target: targetTransform }
  }

  private lock(body: PhysicsBody, targetBody: PhysicsBody) {
    const transform = this.getTransform(body.ammo, targetBody.ammo)
    const constraint = new Ammo.btGeneric6DofConstraint(
      body.ammo,
      targetBody.ammo,
      transform.body,
      transform.target,
      true
    )
    const zero = new Ammo.btVector3(0, 0, 0)
    //TODO: allow these to be configurable
    constraint.setLinearLowerLimit(zero)
    constraint.setLinearUpperLimit(zero)
    constraint.setAngularLowerLimit(zero)
    constraint.setAngularUpperLimit(zero)
    this.physicsWorld.addConstraint(constraint)
  }

  private fixed(body: PhysicsBody, targetBody: PhysicsBody) {
    const transform = this.getTransform(body.ammo, targetBody.ammo)
    transform.body.setRotation(body.ammo.getWorldTransform().getRotation())
    transform.target.setRotation(targetBody.ammo.getWorldTransform().getRotation())
    const constraint = new Ammo.btFixedConstraint(body.ammo, targetBody.ammo, transform.body, transform.target)
    this.physicsWorld.addConstraint(constraint)
  }

  private spring(
    body: PhysicsBody,
    targetBody: PhysicsBody,
    config: {
      stiffness?: number
      damping?: number
      angularLock?: boolean
    } = {}
  ) {
    const { stiffness = 50, damping = 0.01, angularLock = false } = config

    const transform = this.getTransform(body.ammo, targetBody.ammo)
    const constraint = new Ammo.btGeneric6DofSpringConstraint(
      body.ammo,
      targetBody.ammo,
      transform.body,
      transform.target,
      true
    )

    constraint.setLinearLowerLimit(new Ammo.btVector3(-100, -100, -100))
    constraint.setLinearUpperLimit(new Ammo.btVector3(100, 100, 100))

    if (angularLock) {
      constraint.setAngularLowerLimit(new Ammo.btVector3(0, 0, 0))
      constraint.setAngularUpperLimit(new Ammo.btVector3(0, 0, 0))
    }

    for (let i = 0; i < 3; i++) {
      constraint.enableSpring(i, true)
      constraint.setStiffness(i, stiffness)
      constraint.setDamping(i, damping)
    }
    // I have no idea what setEquilibriumPoint does :/
    // constraint.setEquilibriumPoint()
    this.physicsWorld.addConstraint(constraint)
  }

  private slider(body: PhysicsBody, targetBody: PhysicsBody) {
    const transform = this.getTransform(body.ammo, targetBody.ammo)
    //TODO: support setting linear and angular limits
    const constraint = new Ammo.btSliderConstraint(
      body.ammo,
      targetBody.ammo,
      transform.body,
      transform.target,
      true
    )
    constraint.setLowerLinLimit(-1)
    constraint.setUpperLinLimit(1)
    // constraint.setLowerAngLimit();
    // constraint.setUpperAngLimit();
    this.physicsWorld.addConstraint(constraint)
  }

  private hinge(
    body: PhysicsBody,
    targetBody: PhysicsBody,
    config: {
      pivot?: XYZ
      targetPivot?: XYZ
      axis?: XYZ
      targetAxis?: XYZ
    } = {}
  ) {
    const { pivot, targetPivot, axis, targetAxis } = config
    const pivotV3 = new Ammo.btVector3(pivot?.x || 0, pivot?.y || 0, pivot?.z || 0)
    const targetPivotV3 = new Ammo.btVector3(targetPivot?.x || 0, targetPivot?.y || 0, targetPivot?.z || 0)
    const axisV3 = new Ammo.btVector3(axis?.x || 0, axis?.y || 0, axis?.z || 1)
    const targetAxisV3 = new Ammo.btVector3(targetAxis?.x || 0, targetAxis?.y || 0, targetAxis?.z || 1)
    const constraint = new Ammo.btHingeConstraint(
      body.ammo,
      targetBody.ammo,
      pivotV3,
      targetPivotV3,
      axisV3,
      targetAxisV3,
      true
    )
    this.physicsWorld.addConstraint(constraint)
  }

  private coneTwist(body: PhysicsBody, targetPivot: XYZ = {}) {
    const pivotTransform = new Ammo.btTransform()
    pivotTransform.setIdentity()
    pivotTransform.getOrigin().setValue(targetPivot?.x || 0, targetPivot?.y || 0, targetPivot?.z || 0)
    const constraint = new Ammo.btConeTwistConstraint(body.ammo, pivotTransform)
    this.physicsWorld.addConstraint(constraint)
  }

  private pointToPoint(
    body: PhysicsBody,
    targetBody: PhysicsBody,
    config: {
      pivot?: XYZ
      targetPivot?: XYZ
    } = {}
  ) {
    const { pivot, targetPivot } = config
    const pivotV3 = new Ammo.btVector3(pivot?.x || 0, pivot?.y || 0, pivot?.z || 0)
    const targetPivotV3 = new Ammo.btVector3(targetPivot?.x || 0, targetPivot?.y || 0, targetPivot?.z || 0)
    const constraint = new Ammo.btPoint2PointConstraint(body.ammo, targetBody.ammo, pivotV3, targetPivotV3)
    this.physicsWorld.addConstraint(constraint)
  }
}
