/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|LGPL-3.0}
 */

// Inspired by https://github.com/donmccurdy/aframe-physics-system/blob/master/src/components/ammo-constraint.js

import PhysicsBody from '@enable3d/common/dist/physicsBody'
import { XYZ } from '@enable3d/common/dist/types'

export default class Constraints {
  public tmpBtVector3 = new Ammo.btVector3()

  constructor(
    public worldTransform: Ammo.btTransform,
    public physicsWorld: Ammo.btDiscreteDynamicsWorld
  ) {}

  private toAmmoV3(v?: XYZ, d: number = 0) {
    return new Ammo.btVector3(
      typeof v?.x !== 'undefined' ? v.x : d,
      typeof v?.y !== 'undefined' ? v.y : d,
      typeof v?.z !== 'undefined' ? v.z : d
    )
  }

  public get addConstraints() {
    return {
      lock: (bodyA: PhysicsBody, bodyB: PhysicsBody, disableCollisionsBetweenLinkedBodies?: boolean) =>
        this.lock(bodyA, bodyB, disableCollisionsBetweenLinkedBodies),
      fixed: (bodyA: PhysicsBody, bodyB: PhysicsBody, disableCollisionsBetweenLinkedBodies?: boolean) =>
        this.fixed(bodyA, bodyB, disableCollisionsBetweenLinkedBodies),
      pointToPoint: (
        bodyA: PhysicsBody,
        bodyB: PhysicsBody,
        config: {
          pivotA?: XYZ
          pivotB?: XYZ
        },
        disableCollisionsBetweenLinkedBodies?: boolean
      ) => this.pointToPoint(bodyA, bodyB, config, disableCollisionsBetweenLinkedBodies),
      hinge: (
        bodyA: PhysicsBody,
        bodyB: PhysicsBody,
        config: {
          pivotA?: XYZ
          pivotB?: XYZ
          axisA?: XYZ
          axisB?: XYZ
        },
        disableCollisionsBetweenLinkedBodies?: boolean
      ) => this.hinge(bodyA, bodyB, config, disableCollisionsBetweenLinkedBodies),
      slider: (
        bodyA: PhysicsBody,
        bodyB: PhysicsBody,
        config: {
          frameA?: XYZ
          frameB?: XYZ
          linearLowerLimit?: number
          linearUpperLimit?: number
          angularLowerLimit?: number
          angularUpperLimit?: number
        } = {},
        disableCollisionsBetweenLinkedBodies?: boolean
      ) => this.slider(bodyA, bodyB, config, disableCollisionsBetweenLinkedBodies),
      spring: (
        bodyA: PhysicsBody,
        bodyB: PhysicsBody,
        config: {
          stiffness?: number
          damping?: number
          angularLock?: boolean
          linearLowerLimit?: XYZ
          linearUpperLimit?: XYZ
          angularLowerLimit?: XYZ
          angularUpperLimit?: XYZ
          center?: boolean
          offset?: XYZ
          enableSpring?: boolean
        } = {},
        disableCollisionsBetweenLinkedBodies?: boolean
      ) => this.spring(bodyA, bodyB, config, disableCollisionsBetweenLinkedBodies),
      coneTwist: (
        bodyA: PhysicsBody,
        bodyB: PhysicsBody,
        config: {
          frameA: XYZ
          frameB: XYZ
        } = { frameA: {}, frameB: {} },
        disableCollisionsBetweenLinkedBodies?: boolean
      ) => this.coneTwist(bodyA, bodyB, config, disableCollisionsBetweenLinkedBodies),
      dof: (
        bodyA: PhysicsBody,
        bodyB: PhysicsBody,
        config?: {
          linearLowerLimit?: XYZ
          linearUpperLimit?: XYZ
          angularLowerLimit?: XYZ
          angularUpperLimit?: XYZ
          center?: boolean
          offset?: XYZ
        },
        disableCollisionsBetweenLinkedBodies?: boolean
      ) => this.dof(bodyA, bodyB, config, disableCollisionsBetweenLinkedBodies)
    }
  }

  private getTransform(
    bodyA: Ammo.btRigidBody,
    bodyB: Ammo.btRigidBody,
    offset: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
    center: boolean = false
  ) {
    // @ts-expect-error: Should be refactored to avoid the ts error.
    offset = { x: 0, y: 0, z: 0, ...offset }

    const centerVector = (v1: Ammo.btVector3, v2: Ammo.btVector3) => {
      var dx = (v1.x() - v2.x()) / 2 + offset.x
      var dy = (v1.y() - v2.y()) / 2 + offset.y
      var dz = (v1.z() - v2.z()) / 2 + offset.z
      return new Ammo.btVector3(dx, dy, dz)
    }

    const transformB = new Ammo.btTransform()
    transformB.setIdentity()

    if (!center) {
      // offset
      transformB.setOrigin(new Ammo.btVector3(offset.x, offset.y, offset.z))

      const transformA = bodyA.getCenterOfMassTransform().inverse().op_mul(bodyB.getWorldTransform()).op_mul(transformB)

      return { transformA: transformA, transformB: transformB }
    } else {
      const center = centerVector(bodyA.getWorldTransform().getOrigin(), bodyB.getWorldTransform().getOrigin())

      const transformB = new Ammo.btTransform()
      transformB.setIdentity()
      transformB.setOrigin(center)

      const transformA = bodyA.getCenterOfMassTransform().inverse().op_mul(bodyB.getWorldTransform())

      transformA.op_mul(transformB)

      return { transformA: transformA, transformB: transformB }
    }
  }

  private lock(bodyA: PhysicsBody, bodyB: PhysicsBody, disableCollisionsBetweenLinkedBodies = true) {
    const zero = { x: 0, y: 0, z: 0 }
    return this.dof(
      bodyA,
      bodyB,
      { angularLowerLimit: zero, angularUpperLimit: zero },
      disableCollisionsBetweenLinkedBodies
    )
  }

  private fixed(bodyA: PhysicsBody, bodyB: PhysicsBody, disableCollisionsBetweenLinkedBodies = true) {
    const transform = this.getTransform(bodyA.ammo, bodyB.ammo)
    transform.transformA.setRotation(bodyA.ammo.getWorldTransform().getRotation())
    transform.transformB.setRotation(bodyB.ammo.getWorldTransform().getRotation())
    const constraint = new Ammo.btFixedConstraint(bodyA.ammo, bodyB.ammo, transform.transformA, transform.transformB)
    this.physicsWorld.addConstraint(constraint, disableCollisionsBetweenLinkedBodies)
    return constraint
  }

  private pointToPoint(
    bodyA: PhysicsBody,
    bodyB: PhysicsBody,
    config: {
      pivotA?: XYZ
      pivotB?: XYZ
    } = {},
    disableCollisionsBetweenLinkedBodies = true
  ) {
    const { pivotA, pivotB } = config
    const pivotV3 = new Ammo.btVector3(pivotA?.x || 0, pivotA?.y || 0, pivotA?.z || 0)
    const targetPivotV3 = new Ammo.btVector3(pivotB?.x || 0, pivotB?.y || 0, pivotB?.z || 0)
    const constraint = new Ammo.btPoint2PointConstraint(bodyA.ammo, bodyB.ammo, pivotV3, targetPivotV3)
    this.physicsWorld.addConstraint(constraint, disableCollisionsBetweenLinkedBodies)
    return constraint
  }

  private hinge(
    bodyA: PhysicsBody,
    bodyB: PhysicsBody,
    config: {
      pivotA?: XYZ
      pivotB?: XYZ
      axisA?: XYZ
      axisB?: XYZ
    } = {},
    disableCollisionsBetweenLinkedBodies = true
  ) {
    const { pivotA, pivotB, axisA, axisB } = config
    const pivotV3 = new Ammo.btVector3(pivotA?.x || 0, pivotA?.y || 0, pivotA?.z || 0)
    const targetPivotV3 = new Ammo.btVector3(pivotB?.x || 0, pivotB?.y || 0, pivotB?.z || 0)
    const axisV3 = new Ammo.btVector3(axisA?.x || 0, axisA?.y || 0, axisA?.z || 0)
    const targetAxisV3 = new Ammo.btVector3(axisB?.x || 0, axisB?.y || 0, axisB?.z || 0)
    const constraint = new Ammo.btHingeConstraint(
      bodyA.ammo,
      bodyB.ammo,
      pivotV3,
      targetPivotV3,
      axisV3,
      targetAxisV3,
      true
    )

    this.physicsWorld.addConstraint(constraint, disableCollisionsBetweenLinkedBodies)
    return constraint
  }

  // https://pybullet.org/Bullet/phpBB3/viewtopic.php?f=9&t=12690&p=42152&hilit=btSliderConstraint#p42152
  private slider(
    bodyA: PhysicsBody,
    bodyB: PhysicsBody,
    config: {
      frameA?: XYZ
      frameB?: XYZ
      linearLowerLimit?: number
      linearUpperLimit?: number
      angularLowerLimit?: number
      angularUpperLimit?: number
    } = {},
    disableCollisionsBetweenLinkedBodies = true
  ) {
    const transform = this.getTransform(bodyA.ammo, bodyB.ammo)

    const {
      frameA = {},
      frameB = {},
      linearLowerLimit: lll = 0,
      linearUpperLimit: lul = 0,
      angularLowerLimit: all = 0,
      angularUpperLimit: aul = 0
    } = config

    const rotationA = transform.transformA.getRotation()
    rotationA.setEulerZYX(frameA.x || 0, frameA.y || 0, frameA.z || 0)
    transform.transformA.setRotation(rotationA)

    const rotationB = transform.transformB.getRotation()
    rotationB.setEulerZYX(frameB.x || 0, frameB.y || 0, frameB.z || 0)
    transform.transformB.setRotation(rotationB)

    const constraint = new Ammo.btSliderConstraint(
      bodyA.ammo,
      bodyB.ammo,
      transform.transformA,
      transform.transformB,
      true
    )

    constraint.setLowerLinLimit(lll)
    constraint.setUpperLinLimit(lul)
    constraint.setLowerAngLimit(all)
    constraint.setUpperAngLimit(aul)

    this.physicsWorld.addConstraint(constraint, disableCollisionsBetweenLinkedBodies)
    return constraint
  }

  private spring(
    bodyA: PhysicsBody,
    bodyB: PhysicsBody,
    config: {
      stiffness?: number
      damping?: number
      angularLock?: boolean
      linearLowerLimit?: XYZ
      linearUpperLimit?: XYZ
      angularLowerLimit?: XYZ
      angularUpperLimit?: XYZ
      center?: boolean
      offset?: XYZ
      enableSpring?: boolean
    } = {},
    disableCollisionsBetweenLinkedBodies = true
  ) {
    const {
      stiffness = 50,
      damping = 0.01,
      angularLock = false,
      linearLowerLimit: lll = {},
      linearUpperLimit: lul = {},
      angularLowerLimit: all = {},
      angularUpperLimit: aul = {},
      offset = {},
      center = false,
      enableSpring = true
    } = config

    const off = { x: 0, y: 0, z: 0, ...offset }

    const transform = this.getTransform(bodyA.ammo, bodyB.ammo, off, center)
    const constraint = new Ammo.btGeneric6DofSpringConstraint(
      bodyA.ammo,
      bodyB.ammo,
      transform.transformA,
      transform.transformB,
      true
    )

    this.tmpBtVector3.setValue(lll.x || 0, lll.y || 0, lll.z || 0)
    constraint.setLinearLowerLimit(this.tmpBtVector3)

    this.tmpBtVector3.setValue(lul.x || 0, lul.y || 0, lul.z || 0)
    constraint.setLinearUpperLimit(this.tmpBtVector3)

    if (angularLock) {
      this.tmpBtVector3.setValue(0, 0, 0)
      constraint.setAngularLowerLimit(this.tmpBtVector3)
      constraint.setAngularUpperLimit(this.tmpBtVector3)
    } else {
      console.log(all, aul)
      constraint.setAngularLowerLimit(this.toAmmoV3(all, -Math.PI))
      constraint.setAngularUpperLimit(this.toAmmoV3(aul, Math.PI))
    }

    for (let i = 0; i < 3; i++) {
      constraint.enableSpring(i, enableSpring)
      constraint.setStiffness(i, stiffness)
      constraint.setDamping(i, damping)
    }

    // I have no idea what setEquilibriumPoint does :/
    // constraint.setEquilibriumPoint()

    this.physicsWorld.addConstraint(constraint, disableCollisionsBetweenLinkedBodies)

    return constraint
  }

  private coneTwist(
    bodyA: PhysicsBody,
    bodyB: PhysicsBody,
    config: { frameA: XYZ; frameB: XYZ },
    disableCollisionsBetweenLinkedBodies = true
  ) {
    const { frameA, frameB } = config

    const rbAFrame = new Ammo.btTransform()
    rbAFrame.setIdentity()
    rbAFrame.getOrigin().setValue(frameA?.x || 0, frameA?.y || 0, frameA?.z || 0)

    const rbBFrame = new Ammo.btTransform()
    rbBFrame.setIdentity()
    rbBFrame.getOrigin().setValue(frameB?.x || 0, frameB?.y || 0, frameB?.z || 0)

    const t = this.getTransform(bodyA.ammo, bodyB.ammo)

    const constraint = new Ammo.btConeTwistConstraint(bodyB.ammo, bodyA.ammo, rbAFrame, rbBFrame)

    // does not work at all :/
    // constraint.setLimit(-Math.PI / 50, Math.PI / 50)

    constraint.setAngularOnly(true)

    this.physicsWorld.addConstraint(constraint, disableCollisionsBetweenLinkedBodies)

    return constraint
  }

  private dof(
    bodyA: PhysicsBody,
    bodyB: PhysicsBody,
    config: {
      linearLowerLimit?: XYZ
      linearUpperLimit?: XYZ
      angularLowerLimit?: XYZ
      angularUpperLimit?: XYZ
      center?: boolean
      offset?: XYZ
    } = {},
    disableCollisionsBetweenLinkedBodies = true
  ) {
    const { offset, center = false } = config
    const off = { x: 0, y: 0, z: 0, ...offset }

    const transform = this.getTransform(bodyA.ammo, bodyB.ammo, off, center)

    const constraint = new Ammo.btGeneric6DofConstraint(
      bodyA.ammo,
      bodyB.ammo,
      transform.transformA,
      transform.transformB,
      true
    )

    const { linearLowerLimit, linearUpperLimit, angularLowerLimit, angularUpperLimit } = config

    const lll = this.toAmmoV3(linearLowerLimit)
    const lul = this.toAmmoV3(linearUpperLimit)
    const all = this.toAmmoV3(angularLowerLimit, -Math.PI)
    const aul = this.toAmmoV3(angularUpperLimit, Math.PI)

    constraint.setLinearLowerLimit(lll)
    constraint.setLinearUpperLimit(lul)
    constraint.setAngularLowerLimit(all)
    constraint.setAngularUpperLimit(aul)

    Ammo.destroy(lll)
    Ammo.destroy(lul)
    Ammo.destroy(all)
    Ammo.destroy(aul)

    this.physicsWorld.addConstraint(constraint, disableCollisionsBetweenLinkedBodies)

    return constraint
  }
}
