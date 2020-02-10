/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2019 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import {
  SphereConfig,
  MaterialConfig,
  BoxConfig,
  GroundConfig,
  CylinderConfig,
  ExtendedObject3D,
  ExtrudeConfig,
  TorusConfig
} from '../types'
import ThreeGraphics from '../threeWrapper'
import { Vector3, BufferGeometry, Matrix4, Quaternion } from 'three'

interface Shapes {}

class Shapes {
  public tmpTrans: Ammo.btTransform
  public physicsWorld: Ammo.btDiscreteDynamicsWorld
  protected objectsAmmo: { [ptr: number]: any } = {}
  protected addRigidBody: (
    threeObject: ExtendedObject3D,
    physicsShape: any,
    mass: number,
    pos: Vector3,
    quat: Quaternion
  ) => void
  protected createRigidBody: (physicsShape: any, mass: number, pos: Vector3, quat: Quaternion) => Ammo.btRigidBody

  constructor(protected phaser3D: ThreeGraphics) {}

  // originally copied from https://github.com/InfiniteLee/three-to-ammo
  protected addHullShape(mesh: ExtendedObject3D, meshConfig: any = {}) {
    const center = new Vector3()
    const vertex = new Vector3()
    const btVertex = new Ammo.btVector3()
    const originalHull = new Ammo.btConvexHullShape()

    meshConfig.type = 'mesh'
    const { scale } = mesh

    let vertexCount = 0
    this.iterateGeometries(mesh, meshConfig, (geo: any) => {
      vertexCount += geo.attributes.position.array.length / 3
    })

    const maxVertices = 1000
    if (vertexCount > maxVertices) {
      // console.warn(`too many vertices for hull shape; sampling ~${maxVertices} from ~${vertexCount} vertices`)
    }
    const p = Math.min(1, maxVertices / vertexCount)

    this.iterateGeometries(mesh, meshConfig, (geo: any, transform: any) => {
      const components = geo.attributes.position.array
      for (let i = 0; i < components.length; i += 3) {
        if (Math.random() <= p) {
          vertex
            .set(components[i], components[i + 1], components[i + 2])
            .applyMatrix4(transform)
            .sub(center)
          btVertex.setValue(vertex.x, vertex.y, vertex.z)
          originalHull.addPoint(btVertex, i === components.length - 3)
        }
      }
    })
    originalHull.setLocalScaling(new Ammo.btVector3(scale.x, scale.y, scale.z))

    return originalHull
  }

  /** Add a custom convex or concave shape. (Concave shapes can only be static) */
  // originally copied from https://github.com/InfiniteLee/three-to-ammo
  protected addTriMeshShape(mesh: ExtendedObject3D, meshConfig: any = {}) {
    const va = new Vector3()
    const vb = new Vector3()
    const vc = new Vector3()

    meshConfig.type = 'mesh'
    const shape = mesh.shape || 'convex' //  or 'concave'
    const { scale } = mesh

    const bta = new Ammo.btVector3()
    const btb = new Ammo.btVector3()
    const btc = new Ammo.btVector3()
    const triMesh = new Ammo.btTriangleMesh(true, false)

    this.iterateGeometries(mesh, meshConfig, (geo: any, transform: any) => {
      const components = geo.attributes.position.array
      if (geo.index) {
        for (let i = 0; i < geo.index.count; i += 3) {
          const ai = geo.index.array[i] * 3
          const bi = geo.index.array[i + 1] * 3
          const ci = geo.index.array[i + 2] * 3
          va.set(components[ai], components[ai + 1], components[ai + 2]).applyMatrix4(transform)
          vb.set(components[bi], components[bi + 1], components[bi + 2]).applyMatrix4(transform)
          vc.set(components[ci], components[ci + 1], components[ci + 2]).applyMatrix4(transform)
          bta.setValue(va.x, va.y, va.z)
          btb.setValue(vb.x, vb.y, vb.z)
          btc.setValue(vc.x, vc.y, vc.z)
          triMesh.addTriangle(bta, btb, btc, false)
        }
      } else {
        for (let i = 0; i < components.length; i += 9) {
          va.set(components[i + 0], components[i + 1], components[i + 2]).applyMatrix4(transform)
          vb.set(components[i + 3], components[i + 4], components[i + 5]).applyMatrix4(transform)
          vc.set(components[i + 6], components[i + 7], components[i + 8]).applyMatrix4(transform)
          bta.setValue(va.x, va.y, va.z)
          btb.setValue(vb.x, vb.y, vb.z)
          btc.setValue(vc.x, vc.y, vc.z)
          triMesh.addTriangle(bta, btb, btc, false)
        }
      }
    })

    triMesh.setScaling(new Ammo.btVector3(scale.x, scale.y, scale.z))

    // btBvhTriangleMeshShape can be used for static objects only.
    // https://stackoverflow.com/questions/32668218/concave-collision-detection-in-bullet

    const collisionShape =
      shape === 'convex'
        ? new Ammo.btConvexTriangleMeshShape(triMesh, true)
        : new Ammo.btBvhTriangleMeshShape(triMesh, true) // the btBvhTriangleMeshShape classes is the optimized version of btTriangleMeshShape

    // Will be done by the addExisting method
    // collisionShape.setMargin(0.05)
    // this.addRigidBody(mesh, collisionShape, mass, pos, quat)
    // this.addBodyProperties(mesh, meshConfig)

    return collisionShape
  }

  protected addSphere(sphereConfig: SphereConfig = {}, materialConfig: MaterialConfig = {}) {
    const sphere = this.phaser3D.add.sphere(sphereConfig, materialConfig)

    // @ts-ignore
    const { radius } = sphere.geometry.parameters
    const { position: pos, quaternion: quat } = sphere
    const { mass = 1 } = sphereConfig

    const ballShape = new Ammo.btSphereShape(radius)
    ballShape.setMargin(0.05)

    this.addRigidBody(sphere, ballShape, mass, pos, quat)
    this.addBodyProperties(sphere, sphereConfig)

    return sphere
  }

  protected addBox(boxConfig: BoxConfig = {}, materialConfig: MaterialConfig = {}) {
    const box = this.phaser3D.add.box(boxConfig, materialConfig)

    // @ts-ignore
    const { width, height, depth } = box.geometry.parameters
    const { position: pos, quaternion: quat } = box
    const { mass = 1 } = boxConfig

    const boxShape = new Ammo.btBoxShape(new Ammo.btVector3(width / 2, height / 2, depth / 2))
    boxShape.setMargin(0.05)

    this.addRigidBody(box, boxShape, mass, pos, quat)
    this.addBodyProperties(box, boxConfig)

    return box
  }

  protected addGround(groundConfig: GroundConfig, materialConfig: MaterialConfig = {}) {
    const ground = this.phaser3D.add.ground(groundConfig, materialConfig)

    // @ts-ignore
    const { width, height, depth } = ground.geometry.parameters
    const { position: pos, quaternion: quat } = ground
    const { mass = 1 } = groundConfig

    const boxShape = new Ammo.btBoxShape(new Ammo.btVector3(width / 2, height / 2, depth / 2))
    boxShape.setMargin(0.05)

    this.addRigidBody(ground, boxShape, mass, pos, quat)
    this.addBodyProperties(ground, groundConfig)

    return ground
  }

  protected addCylinder(cylinderConfig: CylinderConfig = {}, materialConfig: MaterialConfig = {}) {
    const cylinder = this.phaser3D.add.cylinder(cylinderConfig, materialConfig)

    // @ts-ignore
    const { radiusTop = 1, radiusBottom = 1, height = 1 } = cylinder.geometry.parameters
    const { position: pos, quaternion: quat } = cylinder
    const { mass = 1 } = cylinderConfig

    const btHalfExtents = new Ammo.btVector3(radiusTop, height * 0.5, radiusBottom)
    const ballShape = new Ammo.btCylinderShape(btHalfExtents)
    ballShape.setMargin(0.05)

    this.addRigidBody(cylinder, ballShape, mass, pos, quat)
    this.addBodyProperties(cylinder, cylinderConfig)

    return cylinder
  }

  protected addTorusShape(params: any, quat: any) {
    const { radius = 1, tube = 0.4, tubularSegments = 8 } = params

    const SIMD_PI = Math.PI
    const subdivisions = tubularSegments
    const gap = Math.sqrt(2.0 * tube * tube - 2.0 * tube * tube * Math.cos((2.0 * SIMD_PI) / subdivisions))

    const btHalfExtents = new Ammo.btVector3(tube, SIMD_PI / subdivisions + 0.5 * gap, tube)
    const cylinderShape = new Ammo.btCylinderShape(btHalfExtents)
    cylinderShape.setMargin(0.05)

    const compoundShape = new Ammo.btCompoundShape()

    const forward = new Ammo.btVector3(0, 0, 1)
    const side = new Ammo.btVector3(0, radius, 0)
    const rotation = new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)

    for (let x = 0; x < subdivisions; x++) {
      const angle = (x * 2.0 * SIMD_PI) / subdivisions
      const position = side.rotate(forward, angle)
      const transform = new Ammo.btTransform()
      rotation.setRotation(forward, angle + Math.PI / 2)
      transform.setIdentity()
      transform.setOrigin(position)
      transform.setRotation(rotation)
      compoundShape.addChildShape(transform, cylinderShape)
    }

    return compoundShape
  }

  // https://pybullet.org/Bullet/phpBB3/viewtopic.php?t=7228
  protected addTorus(torusConfig: TorusConfig = {}, materialConfig: MaterialConfig = {}) {
    const torus = this.phaser3D.add.torus(torusConfig, materialConfig)

    const { position: pos, quaternion: quat } = torus
    const { mass = 1 } = torusConfig
    // @ts-ignore
    const params = torus?.geometry?.parameters

    const torusShape = this.addTorusShape(params, quat)
    torusShape.setMargin(0.05)

    // this.addRigidBody(torus, compoundShape, mass, pos, quat)

    this.addRigidBody(torus, torusShape, mass, pos, quat)
    this.addBodyProperties(torus, torusShape)

    return torus
  }

  protected addExtrude(extrudeConfig: ExtrudeConfig, materialConfig: MaterialConfig = {}) {
    const object = this.phaser3D.add.extrude(extrudeConfig, materialConfig)

    const { position: pos, quaternion: quat } = object
    const { mass = 1 } = extrudeConfig

    const shape = this.addTriMeshShape(object, extrudeConfig)
    shape.setMargin(0.05)

    this.addRigidBody(object, shape, mass, pos, quat)
    this.addBodyProperties(object, extrudeConfig)

    return object
  }

  // originally copied from https://github.com/InfiniteLee/three-to-ammo
  protected iterateGeometries(root: any, options = {}, cb: any) {
    const transform = new Matrix4()
    const inverse = new Matrix4()
    const bufferGeometry = new BufferGeometry()

    inverse.getInverse(root.matrixWorld)
    root.traverse((mesh: any) => {
      if (
        mesh.isMesh &&
        // @ts-ignore
        (options.includeInvisible || (mesh.el && mesh.el.object3D.visible) || mesh.visible)
      ) {
        if (mesh === root) {
          transform.identity()
        } else {
          // @ts-ignore
          if (hasUpdateMatricesFunction) mesh.updateMatrices()
          transform.multiplyMatrices(inverse, mesh.matrixWorld)
        }
        // todo: might want to return null xform if this is the root so that callers can avoid multiplying
        // things by the identity matrix
        cb(mesh.geometry.isBufferGeometry ? mesh.geometry : bufferGeometry.fromGeometry(mesh.geometry), transform)
      }
    })
    // }
  }

  protected addBodyProperties(obj: ExtendedObject3D, config: any) {
    const { friction = 0.5, collisionFlag = 0 } = config

    obj.body.ammo.setCollisionFlags(collisionFlag)
    obj.body.ammo.setFriction(friction)
  }
}

export default Shapes
