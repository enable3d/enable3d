/// <reference types="../../common/src/typesAmmo.d.ts" />

import { createHACDShapes, ExtendedGroup } from '@enable3d/ammo-physics'
import { createCollisionShapes, createHullShape, iterateGeometries } from '@enable3d/ammo-physics/dist/three-to-ammo.js'

import { ExtendedMesh, ExtendedObject3D, FLAT, PhysicsLoader, Project, Scene3D, THREE } from 'enable3d'
import { Scale } from 'phaser'
import { BufferGeometry, Matrix4, Mesh, MeshStandardMaterial, Object3D, Quaternion, REVISION, Vector3 } from 'three'
import { ConvexGeometry } from 'three/examples/jsm/Addons.js'
import { ConvexHull, VertexNode } from 'three/examples/jsm/math/ConvexHull.js'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { getDataFromGeometry } from './threeScene_2.js'
import { count } from 'console'

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
    const compound_of_hull = true
    const one_big_hull_2 = true

    if (add_gltf_model) {
      const gltf = await this.load.gltf('tank')
      const m = gltf.scene
      m.position.setZ(-1)
      this.add.existing(m)
      this.physics.add.existing(m, { shape: 'mesh' })
      gltf.scene.position.x - 2
    }

    if (compound_of_hull) {
      const gltf = await this.load.gltf('tank')
      const m = gltf.scene.clone(true)
      // const m = new ExtendedGroup()
      // m.add(this.make.box({ width: 0.5, height: 0.8 }))

      m.position.set(-1, 3, 1)
      m.scale.set(0.5, 0.5, 0.5)
      m.rotateX(1)

      const data: Array<{ vertices: Array<Vector3>; indices: Array<number> }> = []

      setTimeout(() => {
        m.traverse(child => {
          if (child instanceof Mesh) {
            const geo = child.geometry.clone()
            geo.applyMatrix4(child.matrixWorld)
            const d = getDataFromGeometry(geo)
            data.push(d)
          }
        })

        const btVertex = new Ammo.btVector3()

        const hull_array: Array<Ammo.btCollisionShape> = []
        data.forEach((d, i) => {
          const originalHull = new Ammo.btConvexHullShape()
          originalHull.setMargin(MARGIN)

          for (let i = 0; i < d.vertices.length; i++) {
            const vertex = d.vertices[i]
            btVertex.setValue(vertex.x, vertex.y, vertex.z)
            originalHull.addPoint(btVertex)
          }

          originalHull.recalcLocalAabb()

          let collisionShape = originalHull

          //Bullet documentation says don't use convexHulls with 100 verts or more
          if (originalHull.getNumVertices() >= 100) {
            const shapeHull = new Ammo.btShapeHull(originalHull)
            shapeHull.buildHull(MARGIN)
            Ammo.destroy(originalHull)

            collisionShape = new Ammo.btConvexHullShape(
              // @ts-expect-error
              Ammo.getPointer(shapeHull.getVertexPointer()),
              shapeHull.numVertices()
            )
            Ammo.destroy(shapeHull) // btConvexHullShape makes a copy
          }

          // https://github.com/bulletphysics/bullet3/issues/1970
          // collisionShape.initializePolyhedralFeatures(0)
          // this.physics.physicsWorld.getDispatchInfo().m_enableSatConvex = true

          hull_array.push(collisionShape)
        })

        Ammo.destroy(btVertex)

        this.add.existing(m)

        const compoundShape = this.physics.mergeCollisionShapesToCompoundShape(hull_array)
        const localTransform = this.physics.applyPosQuatScaleMargin(compoundShape, m.position, m.quaternion, m.scale)
        //const localTransform = this.physics.applyPosQuatScaleMargin(compoundShape)
        const rigidBody = this.physics.collisionShapeToRigidBody(compoundShape, localTransform, 1, false)

        Ammo.destroy(localTransform)

        this.physics.addRigidBodyToWorld(m, rigidBody)
      }, 500)
    }

    if (one_big_hull_2) {
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
