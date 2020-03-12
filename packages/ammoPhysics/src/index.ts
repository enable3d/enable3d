/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import logger from '@enable3d/common/src/logger'
import PhysicsBody from './physicsBody'
import {
  PlaneConfig,
  SphereConfig,
  GroundConfig,
  MaterialConfig,
  BoxConfig,
  CylinderConfig,
  ConeConfig,
  ExtrudeConfig,
  Phaser3DConfig,
  AddExistingConfig,
  TorusConfig
} from '@enable3d/common/src/types'
import applyMixins from '@enable3d/common/src/applyMixins'
import ExtendedObject3D from '@enable3d/common/src/extendedObject3D'
import Shapes from './shapes'
import Constraints from './constraints'
import Events from './events'
import EventEmitter from 'eventemitter3'
import Physics from './physics'
import { Vector3, Quaternion, Scene, Mesh, Euler } from '@enable3d/three-wrapper/src/index'
import { createCollisionShapes } from './three-to-ammo'
import { addTorusShape } from './torusShape'
import Factories from '@enable3d/common/src/factories'
import { REVISION } from '@enable3d/three-wrapper/src/index'

import { PhysicsLoader } from '@enable3d/common/src/physicsLoader'
import DefaultMaterial from '@enable3d/common/src/defaultMaterial'
export { PhysicsLoader }

import * as Types from '@enable3d/common/src/types'
export { Types }

interface AmmoPhysics extends Physics, Constraints, Shapes, Events {}

class AmmoPhysics extends EventEmitter {
  public tmpTrans: Ammo.btTransform
  protected rigidBodies: ExtendedObject3D[] = []
  protected objectsAmmo: { [ptr: number]: any } = {}
  protected earlierDetectedCollisions: { combinedName: string; collision: boolean }[] = []
  protected gravity: { x: number; y: number; z: number }
  protected factory: Factories

  protected tmpEuler: Euler
  protected tmpQuaternion: Quaternion
  protected tmpVector3: Vector3
  protected tmpBtVector3: Ammo.btVector3
  protected tmpBtQuaternion: Ammo.btQuaternion

  protected defaultMaterial: DefaultMaterial

  constructor(public scene: Scene, public config: Phaser3DConfig = {}) {
    super()

    this.tmpEuler = new Euler()
    this.tmpQuaternion = new Quaternion()
    this.tmpVector3 = new Vector3()
    this.tmpBtVector3 = new Ammo.btVector3()
    this.tmpBtQuaternion = new Ammo.btQuaternion(0, 0, 0, 1)

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

    this.factory = new Factories(scene)

    this.emptyV3 = new Vector3()
    this.impactPoint = new Vector3()
    this.impactNormal = new Vector3()

    this.gravity = config.gravity || { x: 0, y: -9.81, z: 0 }

    this.start()
  }

  public get debug() {
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
        eventCallback: (event: 'start' | 'collision' | 'end') => void
      ) => this.addCollider(object1, object2, eventCallback),
      constraints: this.addConstraints,
      existing: (object: ExtendedObject3D, config?: AddExistingConfig) => this.addExisting(object, config),
      plane: (planeConfig: PlaneConfig = {}, materialConfig: MaterialConfig = {}) =>
        this.addPlane(planeConfig, materialConfig),
      sphere: (sphereConfig: SphereConfig = {}, materialConfig: MaterialConfig = {}) =>
        this.addSphere(sphereConfig, materialConfig),
      ground: (groundConfig: GroundConfig = {}, materialConfig: MaterialConfig = {}) =>
        this.addGround(groundConfig, materialConfig),
      box: (boxConfig: BoxConfig = {}, materialConfig: MaterialConfig = {}) => this.addBox(boxConfig, materialConfig),
      cylinder: (cylinderConfig: CylinderConfig = {}, materialConfig: MaterialConfig = {}) =>
        this.addCylinder(cylinderConfig, materialConfig),
      cone: (coneConfig: ConeConfig = {}, materialConfig: MaterialConfig = {}) =>
        this.addCone(coneConfig, materialConfig),
      torus: (torusConfig: TorusConfig = {}, materialConfig: MaterialConfig = {}) =>
        this.addTorus(torusConfig, materialConfig),
      extrude: (extrudeConfig: ExtrudeConfig, materialConfig: MaterialConfig = {}) =>
        this.addExtrude(extrudeConfig, materialConfig)
    }
  }

  public addCompoundShape(shapes: any) {
    const compoundShape = new Ammo.btCompoundShape()
    shapes.forEach((obj: any, i: number) => {
      const transform = new Ammo.btTransform()

      const pos = new Vector3(obj.x || 0, obj.y || 0, obj.z || 0)
      if (obj.tmp?.offset) {
        const o = obj.tmp.offset
        pos.add(new Vector3(o.x, o.y, o.z))
      }
      transform.setIdentity()
      transform.setOrigin(new Ammo.btVector3(pos.x || 0, pos.y || 0, pos.z || 0))
      // TODO add rotation
      // transform.setRotation(new Ammo.btQuaternion(quat.x || 0, quat.y || 0, quat.z || 0, quat.w || 1))
      compoundShape.addChildShape(transform, shapes[i])
    })
    return compoundShape
  }

  protected addExisting(object: ExtendedObject3D, config: AddExistingConfig = {}): any {
    const { position: pos, quaternion: quat, hasBody } = object

    const {
      mass = 1,
      autoCenter = false,
      offset = undefined,
      shapes = [],
      breakable = false,
      addRigidBody = true,
      addChildren = true
    } = config

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

    // check if the object has children
    const children: any[] = []
    if (addChildren && object.children.length >= 1) {
      object.children.forEach((child: any) => {
        if (child.isMesh) {
          const shape = this.addExisting(child, { addRigidBody: false })
          shape.tmp = { offset: child.position.clone() }
          children.push(shape)
        }
      })
    }

    let shape = 'box'
    const type = object.geometry?.type || 'box'
    // retrieve the shape from the geometry
    if (/box/i.test(type)) shape = 'box'
    else if (/cone/i.test(type)) shape = 'cone'
    else if (/cylinder/i.test(type)) shape = 'cylinder'
    else if (/extrude/i.test(type)) shape = 'extrude'
    else if (/plane/i.test(type)) shape = 'plane'
    else if (/sphere/i.test(type)) shape = 'sphere'
    else if (/torus/i.test(type)) shape = 'torus'

    let params = {}
    if (config.shape) {
      params = { ...defaultParams, ...config }
      shape = config.shape
    } else if (object.shape) {
      // @ts-ignore
      params = { ...defaultParams, ...object?.geometry?.parameters }
      shape = object.shape
    } else {
      // @ts-ignore
      params = { ...defaultParams, ...object?.geometry?.parameters }
    }

    // Add default params if undefined
    Object.keys(params).forEach(key => {
      // @ts-ignore
      if (typeof params[key] === 'undefined' && defaultParams[key]) {
        // @ts-ignore
        params[key] = defaultParams[key]
      }
    })

    if (hasBody) {
      logger(`Object "${object.name}" already has a physical body!`)
      return
    }

    // auto adjust the center for custom shapes
    if (autoCenter) object.geometry.center()

    // some aliases
    if (shape === 'extrude') shape = 'hacd'
    if (shape === 'mesh' || shape === 'convex') shape = 'convexMesh'
    if (shape === 'concave') shape = 'concaveMesh'

    let Shape: any

    // combine multiple shapes to one compound shape
    if (shapes.length > 0) {
      const tmp: any[] = [] // stores all the raw shapes

      shapes.forEach(obj => {
        const s = this.addShape({ shape: obj.shape, params: { ...obj } })
        // @ts-ignore
        s.tmp = { offset: { x: obj.x || 0, y: obj.y || 0, z: obj.z || 0 } }
        // TODO add rotation as well
        tmp.push(s)
      })

      Shape = this.addCompoundShape(tmp)
    } else {
      Shape = this.addShape({ shape, shapes, params, object, quat })
    }

    if (!Shape) {
      logger(`Could not recognize shape "${shape}"!`)
      return
    }

    if (children.length >= 1) {
      Shape = this.addCompoundShape([Shape, ...children])
    }

    Shape.setMargin(0.05)

    if (!addRigidBody) return Shape

    this.addRigidBodyToShape(object, Shape, { mass, pos, quat, breakable, offset, config })
  }

  public addRigidBodyToShape(object: any, Shape: any, options: any) {
    const {
      mass = 1,
      pos = new Vector3(0, 0, 0),
      quat = new Quaternion(0, 0, 0, 1),
      breakable = false,
      offset = { x: 0, y: 0, z: 0 },
      config = {}
    } = options
    this.addRigidBody(object, Shape, mass, pos, quat)
    this.addBodyProperties(object, config)

    if (breakable) object.body.breakable = true
    if (offset) object.body.offset = { x: 0, y: 0, z: 0, ...offset }
  }

  private addShape(opts: any) {
    const { shape, object, params, quat } = opts

    let Shape
    switch (shape) {
      case 'plane':
        Shape = createCollisionShapes(object, { type: 'mesh', concave: false })
        break
      case 'box':
        Shape = new Ammo.btBoxShape(new Ammo.btVector3(params.width / 2, params.height / 2, params.depth / 2))
        break
      case 'sphere':
        Shape = new Ammo.btSphereShape(params.radius)
        break
      case 'cylinder':
        Shape = new Ammo.btCylinderShape(new Ammo.btVector3(params.radiusTop, params.height / 2, 0))
        break
      case 'cone':
        Shape = new Ammo.btConeShape(params.radius, params.height)
        break
      case 'torus':
        Shape = addTorusShape(params, quat)
        break
      case 'capsule':
        Shape = new Ammo.btCapsuleShape(params.radius, params.height)
        break
      case 'hull':
        Shape = createCollisionShapes(object, { type: 'hull' })
        break
      case 'hacd':
        Shape = createCollisionShapes(object, { type: 'hacd' })
        break
      case 'vhacd':
        Shape = createCollisionShapes(object, { type: 'vhacd' })
        break
      case 'convexMesh':
        Shape = createCollisionShapes(object, { type: 'mesh', concave: false })
        break
      case 'concaveMesh':
        Shape = createCollisionShapes(object, { type: 'mesh', concave: true })
        break
    }

    if (Array.isArray(Shape)) {
      const compoundShape = new Ammo.btCompoundShape()
      Shape.forEach(shape => {
        const transform = new Ammo.btTransform()
        transform.setIdentity()
        compoundShape.addChildShape(transform, shape)
      })
      Shape = compoundShape
    }

    return Shape
  }

  protected createRigidBody(physicsShape: any, mass: number, pos: Vector3, quat: Quaternion) {
    const transform = new Ammo.btTransform()
    transform.setIdentity()
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z))
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w))
    const motionState = new Ammo.btDefaultMotionState(transform)
    const localInertia = new Ammo.btVector3(0, 0, 0)
    if (mass > 0) {
      physicsShape.calculateLocalInertia(mass, localInertia)
    }
    const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, physicsShape, localInertia)
    const rigidBody = new Ammo.btRigidBody(rbInfo)
    return rigidBody
  }

  protected addRigidBody(
    threeObject: ExtendedObject3D,
    physicsShape: any,
    mass: number,
    pos: Vector3,
    quat: Quaternion,
    scale?: { x: number; y: number; z: number }
  ) {
    threeObject.position.copy(pos)
    threeObject.quaternion.copy(quat)

    const rigidBody = this.createRigidBody(physicsShape, mass, pos, quat)

    if (scale) {
      const localScale = new Ammo.btVector3(scale.x, scale.y, scale.z)
      physicsShape.setLocalScaling(localScale)
      Ammo.destroy(localScale)
    }

    if (mass > 0) {
      // Disable deactivation
      rigidBody.setActivationState(4)
    }

    this.rigidBodies.push(threeObject)
    this.physicsWorld.addRigidBody(rigidBody)

    const ptr = Object.values(rigidBody)[0]
    // @ts-ignore
    rigidBody.name = threeObject.name
    threeObject.body = new PhysicsBody(this, rigidBody)
    threeObject.hasBody = true
    // @ts-ignore
    threeObject.ptr = ptr
    this.objectsAmmo[ptr] = threeObject
  }

  protected addBodyProperties(obj: ExtendedObject3D, config: any) {
    const { friction = 0.5, collisionFlags = 0 } = config
    obj.body.setCollisionFlags(collisionFlags)
    obj.body.setFriction(friction)
  }
}

applyMixins(AmmoPhysics, [Physics, Constraints, Shapes, Events])

export { AmmoPhysics }
