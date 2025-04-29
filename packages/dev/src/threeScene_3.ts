/// <reference types="../../common/src/typesAmmo.d.ts" />

import { ExtendedMesh, ExtendedObject3D, FLAT, PhysicsLoader, Project, Scene3D, THREE } from 'enable3d'
import { Scale } from 'phaser'
import { BufferGeometry, Matrix4, Mesh, MeshStandardMaterial, Object3D, Quaternion, REVISION, Vector3 } from 'three'
import { ConvexGeometry } from 'three/examples/jsm/Addons.js'
import { ConvexHull, VertexNode } from 'three/examples/jsm/math/ConvexHull.js'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { getDataFromGeometry } from './threeScene_2.js'
import { count } from 'console'
import { SimplifyModifier } from 'three/examples/jsm/modifiers/SimplifyModifier.js'

const isTouchDevice = 'ontouchstart' in window

class MainScene extends Scene3D {
  ui!: FLAT.FlatArea
  box1!: ExtendedMesh

  preRender() {
    FLAT.preRender(this.renderer)
  }

  postRender() {
    FLAT.postRender(this.renderer, this.ui)
  }

  update(_time: number, _delta: number): void {}

  async create() {
    this.ui = FLAT.init(this.renderer)

    const size = new THREE.Vector2()
    this.renderer.getSize(size)

    const texture = new FLAT.TextTexture('hello')
    const text = new FLAT.TextSprite(texture)
    text.setPosition(size.x / 2, size.y - text.textureHeight)
    this.ui.scene.add(text)

    console.log('REVISION', THREE.REVISION)
    console.log('REVISION', REVISION)

    const { orbitControls } = await this.warpSpeed('-ground')

    const x = this.physics.add.box(
      { width: 10, height: 1, depth: 10, y: -2, collisionFlags: 1 },
      { lambert: { transparent: true, opacity: 1 } }
    )

    // setTimeout(() => {
    //   this.physics.add.sphere({ radius: 0.05, y: 5, x: -3 + Math.random(), z: 1 + Math.random() })
    //   this.physics.add.sphere({ radius: 0.05, y: 5, x: -3 + Math.random(), z: 1 + Math.random() })
    //   this.physics.add.sphere({ radius: 0.05, y: 5, x: -3 + Math.random(), z: 1 + Math.random() })
    //   this.physics.add.sphere({ radius: 0.05, y: 5, x: -3 + Math.random(), z: 1 + Math.random() })
    //   this.physics.add.sphere({ radius: 0.05, y: 5, x: -3 + Math.random(), z: 1 + Math.random() })
    //   this.physics.add.sphere({ radius: 0.05, y: 5, x: -3 + Math.random(), z: 1 + Math.random() })
    //   this.physics.add.sphere({ radius: 0.05, y: 5, x: -3 + Math.random(), z: 1 + Math.random() })
    //   this.physics.add.sphere({ radius: 0.05, y: 5, x: -3 + Math.random(), z: 1 + Math.random() })
    //   this.physics.add.sphere({ radius: 0.05, y: 5, x: -3 + Math.random(), z: 1 + Math.random() })
    //   this.physics.add.sphere({ radius: 0.05, y: 5, x: -3 + Math.random(), z: 1 + Math.random() })
    // }, 1000)

    this.camera.position.set(4, 2, 8)
    this.camera.lookAt(0, -1, 0)
    orbitControls?.target.set(0, -1, 0)
    this.physics.debug?.enable()
    this.physics.debug?.mode(15)

    await this.load.preload('tank', '/assets/Tank.glb')

    const MARGIN = 0.01
    const meshes: Array<Mesh> = []

    const add_gltf_model = true
    const BvhTriangleMesh = true
    const GimpactTriangleMesh = false

    if (add_gltf_model) {
      const gltf = await this.load.gltf('tank')
      const m = gltf.scene
      m.position.setZ(-0.5)
      m.position.setY(-1)
      m.position.set(-1, -1, 1)
      m.scale.set(0.5, 0.5, 0.5)
      // this.add.existing(m)
      // this.physics.add.existing(m, { shape: 'hacd', width: 5, depth: 5, collisionFlags: 1, mass: 0 })
      gltf.scene.position.x - 2
    }

    if (BvhTriangleMesh) {
      const gltf = await this.load.gltf('tank')
      let m = gltf.scene.clone(true)

      m.position.set(-1, 3, 1)
      //m.scale.set(0.5, 0.5, 0.5)
      m.rotateX(1)

      //---

      const data: Array<{ vertices: Array<number>; indices: Array<number> }> = []

      m.traverse(child => {
        if (child instanceof Mesh) {
          const geo = child.geometry.clone()
          // const modifier = new SimplifyModifier()
          // const count = Math.floor(geo.attributes.position.count * 0.875) // number of vertices to remove
          // const geo_simplified = modifier.modify(geo, count)

          geo.applyMatrix4(child.matrixWorld)
          const d = getDataFromGeometry(geo)
          data.push(d)
        }
      })

      const btVertex = new Ammo.btVector3()

      const hull_array: Array<Ammo.btCollisionShape> = []
      data.forEach((d, i) => {
        const bta = new Ammo.btVector3()
        const btb = new Ammo.btVector3()
        const btc = new Ammo.btVector3()
        const triMesh = new Ammo.btTriangleMesh(true, false)

        const va = new Vector3()
        const vb = new Vector3()
        const vc = new Vector3()
        const matrix = new Matrix4()

        const { indices: faces, vertices } = d
        for (let j = 0; j < faces.length; j += 3) {
          const ai = faces[j] * 3
          const bi = faces[j + 1] * 3
          const ci = faces[j + 2] * 3
          va.set(vertices[ai], vertices[ai + 1], vertices[ai + 2]).applyMatrix4(matrix)
          vb.set(vertices[bi], vertices[bi + 1], vertices[bi + 2]).applyMatrix4(matrix)
          vc.set(vertices[ci], vertices[ci + 1], vertices[ci + 2]).applyMatrix4(matrix)
          bta.setValue(va.x, va.y, va.z)
          btb.setValue(vb.x, vb.y, vb.z)
          btc.setValue(vc.x, vc.y, vc.z)
          triMesh.addTriangle(bta, btb, btc, false)
        }
        let collisionShape
        collisionShape = new Ammo.btGImpactMeshShape(triMesh)
        collisionShape.setLocalScaling(new Ammo.btVector3(1, 1, 1))
        collisionShape.setMargin(0.01)
        collisionShape.updateBound()

        //collisionShape.child

        // https://github.com/bulletphysics/bullet3/issues/1970
        // collisionShape.initializePolyhedralFeatures(0)
        // this.physics.physicsWorld.getDispatchInfo().m_enableSatConvex = true

        hull_array.push(collisionShape)
      })

      Ammo.destroy(btVertex)

      this.add.existing(m)

      const compoundShape = this.physics.mergeCollisionShapesToCompoundShape(hull_array)
      compoundShape.setLocalScaling
      const localTransform = this.physics.applyPosQuatScaleMargin(compoundShape, m.position, m.quaternion, m.scale)
      //const localTransform = this.physics.applyPosQuatScaleMargin(compoundShape)
      const rigidBody = this.physics.collisionShapeToRigidBody(compoundShape, localTransform, 1, false)

      Ammo.destroy(localTransform)

      this.physics.addRigidBodyToWorld(m, rigidBody)
    }

    if (GimpactTriangleMesh) {
      const gltf = await this.load.gltf('tank')
      const m = gltf.scene.clone(true)
      m.position.set(1, 3, 1)
      m.scale.set(0.5, 0.5, 0.5)
      m.rotateX(1)
      this.add.existing(m)

      const _geometries: Array<BufferGeometry> = []

      setTimeout(() => {
        m.traverse(c => {
          if (c.isMesh) {
            const geo = c.geometry.clone()
            geo.applyMatrix4(c.matrixWorld)
            _geometries.push(geo)
          }
        })

        let geometries = BufferGeometryUtils.mergeGeometries(_geometries)
        const g = BufferGeometryUtils.mergeVertices(geometries)

        const btVertex = new Ammo.btVector3()
        const vertex = new THREE.Vector3()

        const aabb = new THREE.Box3()
        aabb.setFromObject(gltf.scene)

        const hull_array = []
        const originalHull = new Ammo.btConvexHullShape()
        originalHull.setMargin(MARGIN)

        //this.add.existing(new Mesh(g, this.add.material({ lambert: { color: 'black' } })))

        const position = g.getAttribute('position')
        for (let i = 0; i < position.count; i++) {
          vertex.fromBufferAttribute(position, i) // read vertex
          btVertex.setValue(vertex.x, vertex.y, vertex.z)
          originalHull.addPoint(btVertex)
        }

        originalHull.recalcLocalAabb()

        let collisionShape = originalHull
        if (originalHull.getNumVertices() >= 100) {
          //Bullet documentation says don't use convexHulls with 100 verts or more
          const shapeHull = new Ammo.btShapeHull(originalHull)
          shapeHull.buildHull(MARGIN)
          Ammo.destroy(originalHull)
          collisionShape = new Ammo.btConvexHullShape(
            Ammo.getPointer(shapeHull.getVertexPointer()),
            shapeHull.numVertices()
          )
          Ammo.destroy(shapeHull) // btConvexHullShape makes a copy
        }

        // https://github.com/bulletphysics/bullet3/issues/1970
        // collisionShape.initializePolyhedralFeatures(0)
        //this.physics.physicsWorld.getDispatchInfo().m_enableSatConvex = true

        hull_array.push(collisionShape)

        const compoundShape = new Ammo.btCompoundShape()
        const transform = new Ammo.btTransform()
        transform.setIdentity()
        compoundShape.addChildShape(transform, collisionShape)

        //   const compoundShape = this.physics.mergeCollisionShapesToCompoundShape(hull_array)
        const localTransform = this.physics.applyPosQuatScaleMargin(
          compoundShape,
          m.position.clone(),
          m.quaternion.clone(),
          m.scale.clone()
        )
        const rigidBody = this.physics.collisionShapeToRigidBody(compoundShape, localTransform, 1, false)
        this.physics.addRigidBodyToWorld(m, rigidBody)
      })
    }
  }
}

const startProject = () => {
  PhysicsLoader('/lib', () => new Project({ scenes: [MainScene] }))
}

export default startProject
