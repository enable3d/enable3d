/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import logger from '@enable3d/common/dist/logger'
import PhysicsBody from '@enable3d/common/dist/physicsBody'

import applyMixins from '@enable3d/common/dist/applyMixins'

import { ExtendedObject3D } from '@enable3d/common/dist/extendedObject3D'
export { ExtendedObject3D }

import { ExtendedMesh } from '@enable3d/common/dist/extendedMesh'
export { ExtendedMesh }

import Shapes from './shapes'
import Constraints from './constraints'
import Events from './events'
import EventEmitter from 'eventemitter3'
import Physics from './physics'
import { Vector3, Quaternion, Scene, Mesh, Euler } from '@enable3d/three-wrapper/dist/index'
import { createCollisionShapes } from './three-to-ammo'
import { addTorusShape } from './torusShape'
import Factories from '@enable3d/common/dist/factories'
import { REVISION } from '@enable3d/three-wrapper/dist/index'

import { PhysicsLoader } from '@enable3d/common/dist/physicsLoader'
import DefaultMaterial from '@enable3d/common/dist/defaultMaterial'
export { PhysicsLoader }

import * as Types from '@enable3d/common/dist/types'
import { ClosestRaycaster, AllHitsRaycaster } from './raycaster/raycaster'
export { ClosestRaycaster, AllHitsRaycaster }
export { Types }

// Export THREE.Clock
export { Clock } from './lib/Clock'

interface AmmoPhysics extends Physics, Constraints, Shapes, Events {}

class AmmoPhysics extends EventEmitter {
  public tmpTrans: Ammo.btTransform
  public factory: Factories
  public isHeadless: boolean

  public rigidBodies: ExtendedObject3D[] = []
  public objectsAmmo: { [ptr: number]: ExtendedObject3D } = {}
  protected earlierDetectedCollisions: { combinedName: string; collision: boolean }[] = []
  protected gravity: { x: number; y: number; z: number }

  protected tmpEuler: Euler
  protected tmpQuaternion: Quaternion
  protected tmpVector3: Vector3
  protected tmpBtVector3: Ammo.btVector3
  protected tmpBtQuaternion: Ammo.btQuaternion

  protected defaultMaterial: DefaultMaterial

  constructor(public scene: Scene | 'headless', public config: Types.ThreeGraphicsConfig = {}) {
    super()

    this.isHeadless = scene === 'headless' ? true : false
    this.tmpEuler = new Euler()
    this.tmpQuaternion = new Quaternion()
    this.tmpVector3 = new Vector3()
    this.tmpBtVector3 = new Ammo.btVector3()
    this.tmpBtQuaternion = new Ammo.btQuaternion(0, 0, 0, 1)

    if (scene !== 'headless') {
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
    }

    this.factory = new Factories(scene)

    this.emptyV3 = new Vector3()
    this.impactPoint = new Vector3()
    this.impactNormal = new Vector3()

    this.gravity = config.gravity || { x: 0, y: -9.81, z: 0 }

    this.start()
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
      collider: (
        object1: ExtendedObject3D,
        object2: ExtendedObject3D,
        eventCallback: (event: 'start' | 'collision' | 'end') => void
      ) => this.addCollider(object1, object2, eventCallback),
      constraints: this.addConstraints,
      existing: (object: ExtendedObject3D, config?: Types.AddExistingConfig) => this.addExisting(object, config),
      plane: (planeConfig: Types.PlaneConfig = {}, materialConfig: Types.MaterialConfig = {}) =>
        this.addPlane(planeConfig, materialConfig),
      sphere: (sphereConfig: Types.SphereConfig = {}, materialConfig: Types.MaterialConfig = {}) =>
        this.addSphere(sphereConfig, materialConfig),
      ground: (groundConfig: Types.GroundConfig = {}, materialConfig: Types.MaterialConfig = {}) =>
        this.addGround(groundConfig, materialConfig),
      box: (boxConfig: Types.BoxConfig = {}, materialConfig: Types.MaterialConfig = {}) =>
        this.addBox(boxConfig, materialConfig),
      cylinder: (cylinderConfig: Types.CylinderConfig = {}, materialConfig: Types.MaterialConfig = {}) =>
        this.addCylinder(cylinderConfig, materialConfig),
      cone: (coneConfig: Types.ConeConfig = {}, materialConfig: Types.MaterialConfig = {}) =>
        this.addCone(coneConfig, materialConfig),
      torus: (torusConfig: Types.TorusConfig = {}, materialConfig: Types.MaterialConfig = {}) =>
        this.addTorus(torusConfig, materialConfig),
      extrude: (extrudeConfig: Types.ExtrudeConfig, materialConfig: Types.MaterialConfig = {}) =>
        this.addExtrude(extrudeConfig, materialConfig),
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

  // public addCompoundShape(shapes: any) {
  //   const compoundShape = new Ammo.btCompoundShape()
  //   shapes.forEach((obj: any, i: number) => {
  //     const transform = new Ammo.btTransform()

  //     const pos = new Vector3(obj.x || 0, obj.y || 0, obj.z || 0)
  //     if (obj.tmp?.offset) {
  //       const o = obj.tmp.offset
  //       pos.add(new Vector3(o.x, o.y, o.z))
  //     }
  //     transform.setIdentity()
  //     transform.setOrigin(new Ammo.btVector3(pos.x || 0, pos.y || 0, pos.z || 0))
  //     // TODO add rotation
  //     // transform.setRotation(new Ammo.btQuaternion(quat.x || 0, quat.y || 0, quat.z || 0, quat.w || 1))
  //     compoundShape.addChildShape(transform, shapes[i])
  //   })
  //   return compoundShape
  // }

  private prepareThreeObjectForCollisionShape(object: ExtendedObject3D, config: Types.AddExistingConfig = {}) {
    const { position: pos, quaternion: quat, hasBody } = object
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
    const type = object.geometry?.type || 'unknown'
    if (/box/i.test(type)) shape = 'box'
    else if (/cone/i.test(type)) shape = 'cone'
    else if (/cylinder/i.test(type)) shape = 'cylinder'
    else if (/extrude/i.test(type)) shape = 'extrude'
    else if (/plane/i.test(type)) shape = 'plane'
    else if (/sphere/i.test(type)) shape = 'sphere'
    else if (/torus/i.test(type)) shape = 'torus'

    // @ts-ignore
    let params = { ...defaultParams, ...object?.geometry?.parameters }

    if (config.shape) {
      params = { ...defaultParams, ...config }
      shape = config.shape
    } else if (object.shape) {
      shape = object.shape
    }

    // Add all default params if undefined
    Object.keys(params).forEach(key => {
      // @ts-ignore
      if (typeof params[key] === 'undefined' && defaultParams[key]) {
        // @ts-ignore
        params[key] = defaultParams[key]
      }
    })

    // auto adjust the center for custom shapes
    if (autoCenter) object.geometry.center()

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

  public createCollisionShape(shape: string, params: any, object?: ExtendedObject3D): Ammo.btCollisionShape {
    const quat = object?.quaternion ? object?.quaternion : new Quaternion(0, 0, 0, 1)

    let collisionShape
    switch (shape) {
      case 'box':
        collisionShape = new Ammo.btBoxShape(new Ammo.btVector3(params.width / 2, params.height / 2, params.depth / 2))
        break
      case 'sphere':
        collisionShape = new Ammo.btSphereShape(params.radius)
        break
      case 'cylinder':
        collisionShape = new Ammo.btCylinderShape(new Ammo.btVector3(params.radiusTop, params.height / 2, 0))
        break
      case 'cone':
        collisionShape = new Ammo.btConeShape(params.radius, params.height)
        break
      case 'torus':
        collisionShape = addTorusShape(params, quat)
        break
      case 'capsule':
        collisionShape = new Ammo.btCapsuleShape(params.radius, params.height)
        break
      case 'plane':
        collisionShape = createCollisionShapes(object, { type: 'mesh', concave: false })
        break
      case 'hull':
        collisionShape = createCollisionShapes(object, { type: 'hull' })
        break
      case 'hacd':
        collisionShape = createCollisionShapes(object, { type: 'hacd' })
        break
      case 'vhacd':
        collisionShape = createCollisionShapes(object, { type: 'vhacd' })
        break
      case 'convexMesh':
        collisionShape = createCollisionShapes(object, { type: 'mesh', concave: false })
        break
      case 'concaveMesh':
        collisionShape = createCollisionShapes(object, { type: 'mesh', concave: true })
        break
    }

    // if there is a x, y or z, take is as temporary offset parameter
    const { x, y, z } = params
    if (x || y || z) {
      // @ts-ignore
      collisionShape.offset = { x: x || 0, y: y || 0, z: z || 0 }
    }

    // in some cases, like hacd, it will be an array of shapes
    // so we merge them
    if (Array.isArray(collisionShape)) collisionShape = this.mergeCollisionShapesToCompoundShape(collisionShape)

    return collisionShape as Ammo.btCollisionShape
  }

  public mergeCollisionShapesToCompoundShape(collisionShapes: Ammo.btCollisionShape[]): Ammo.btCompoundShape {
    const compoundShape = new Ammo.btCompoundShape()
    collisionShapes.forEach(shape => {
      // @ts-ignore
      const { offset } = shape // offset is a custom parameter

      const transform = new Ammo.btTransform()
      transform.setIdentity()
      if (offset) transform.setOrigin(new Ammo.btVector3(offset.x || 0, offset.y || 0, offset.z || 0))
      compoundShape.addChildShape(transform, shape)
    })
    return compoundShape
  }

  protected addExisting(object: ExtendedObject3D, config: Types.AddExistingConfig = {}): any {
    const { hasBody } = object
    if (hasBody) {
      console.warn(`[Enable3d]: Object "${object.name}" already has a physical body!`)
      return
    }

    const { position: pos, quaternion: quat } = object
    const {
      shape = 'unknown',
      compound = [],
      mass = 1,
      collisionFlags = 0,
      offset = undefined,
      breakable = false,
      addChildren = true
    } = config

    if (compound.length >= 1) {
      // if we want a custom compound shape, we simply do
      const collisionShapes = compound.map((s: any) => this.createCollisionShape(s.shape, s))
      const compoundShape = this.mergeCollisionShapesToCompoundShape(collisionShapes)
      const rigidBody = this.collisionShapeToRigidBody(compoundShape, object.position, object.quaternion, 1)
      this.addRigidBodyToWorld(object, rigidBody)
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
          // @ts-ignore
          cs.offset = child.position.clone() // this is relative position to its parent
          collisionShapes.push(cs)
        }
      })
    }

    const collisionShape =
      collisionShapes.length === 1 ? collisionShapes[0] : this.mergeCollisionShapesToCompoundShape(collisionShapes)

    // add rigid body
    // object.position.copy(pos)
    // object.quaternion.copy(quat)

    const rigidBody = this.collisionShapeToRigidBody(collisionShape, pos, quat, mass)

    // const scale = { x: 1, y: 1, z: 1 }
    // if (scale) {
    //   const localScale = new Ammo.btVector3(scale.x, scale.y, scale.z)
    //   Shape.setLocalScaling(localScale)
    //   Ammo.destroy(localScale)
    // }

    this.addRigidBodyToWorld(object, rigidBody, collisionFlags, breakable, offset)
  }

  public addRigidBodyToWorld(
    object: ExtendedObject3D,
    rigidBody: Ammo.btRigidBody,
    collisionFlags = 0,
    breakable?: boolean,
    offset?: { x?: number; y?: number; z?: number }
  ) {
    this.rigidBodies.push(object)
    this.physicsWorld.addRigidBody(rigidBody)

    const ptr = Object.values(rigidBody)[0]
    // @ts-ignore
    rigidBody.name = object.name
    object.body = new PhysicsBody(this, rigidBody)
    object.hasBody = true
    // @ts-ignore
    object.ptr = ptr
    this.objectsAmmo[ptr] = object

    if (breakable) object.body.breakable = true
    if (offset) object.body.offset = { x: 0, y: 0, z: 0, ...offset }

    object.body.setCollisionFlags(collisionFlags)
  }

  // protected getShape(shape: any, shapes: any, children: any, params: any, object: any, quat: any) {
  //   let Shape: Ammo.btConvexShape

  //   // combine multiple shapes to one compound shape
  //   if (shapes.length > 0) {
  //     const tmp: any[] = [] // stores all the raw shapes

  //     shapes.forEach((obj: any) => {
  //       const s = this.addShape({ shape: obj.shape, params: { ...obj } })
  //       // @ts-ignore
  //       s.tmp = { offset: { x: obj.x || 0, y: obj.y || 0, z: obj.z || 0 } }
  //       // TODO add rotation as well
  //       tmp.push(s)
  //     })

  //     Shape = this.addCompoundShape(tmp)
  //   } else {
  //     Shape = this.addShape({ shape, shapes, params, object, quat })
  //   }

  //   if (!Shape) {
  //     logger(`Could not recognize shape "${shape}"!`)
  //     return
  //   }

  //   if (children.length >= 1) {
  //     Shape = this.addCompoundShape([Shape, ...children])
  //   }

  //   Shape.setMargin(0.05)

  //   return Shape as Ammo.btConvexShape
  // }

  // public addRigidBodyToShape(object: any, Shape: any, options: any) {
  //   const {
  //     mass = 1,
  //     pos = new Vector3(0, 0, 0),
  //     quat = new Quaternion(0, 0, 0, 1),
  //     breakable = false,
  //     offset = { x: 0, y: 0, z: 0 },
  //     config = {}
  //   } = options
  //   this.addRigidBody(object, Shape, mass, pos, quat)
  //   this.addBodyProperties(object, config)

  //   if (breakable) object.body.breakable = true
  //   if (offset) object.body.offset = { x: 0, y: 0, z: 0, ...offset }
  // }

  // private addShape(opts: any) {
  //   const { shape, object, params, quat } = opts
  // }

  public collisionShapeToRigidBody(
    physicsShape: Ammo.btCollisionShape,
    pos: Vector3,
    quat: Quaternion,
    mass: number = 1
  ) {
    const transform = new Ammo.btTransform()
    transform.setIdentity()
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z))
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w))
    const motionState = new Ammo.btDefaultMotionState(transform)
    const localInertia = new Ammo.btVector3(0, 0, 0)
    if (mass > 0) physicsShape.calculateLocalInertia(mass, localInertia)
    const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, physicsShape, localInertia)
    const rigidBody = new Ammo.btRigidBody(rbInfo)
    if (mass > 0) rigidBody.setActivationState(4) // Disable deactivation
    return rigidBody
  }
}

applyMixins(AmmoPhysics, [Physics, Constraints, Shapes, Events])

export { AmmoPhysics }
