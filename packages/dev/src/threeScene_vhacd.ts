/// <reference types="../../common/src/typesAmmo.d.ts" />

import {
  ExtendedGroup,
  ExtendedMesh,
  ExtendedObject3D,
  FirstPersonControls,
  FLAT,
  PhysicsLoader,
  Project,
  Scene3D,
  THREE
} from 'enable3d'
import { Scale } from 'phaser'
import {
  BufferGeometry,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  REVISION,
  Vector3
} from 'three'
import { ConvexGeometry, InstancedFlow, OrbitControls } from 'three/examples/jsm/Addons.js'
import { ConvexHull, VertexNode } from 'three/examples/jsm/math/ConvexHull.js'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { getDataFromGeometry, getDataFromMesh } from './threeScene_2.js'
import { count } from 'console'
import { SimplifyModifier } from 'three/examples/jsm/modifiers/SimplifyModifier.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { create_hull_shape } from './shape_hull.js'
import { createHullShape } from '@enable3d/ammo-physics/dist/three-to-ammo.js'
import { create_hacd_shape } from './shape_hacd.js'
import { create_gimpact_shape } from './shape_gimpact.js'

import * as Comlink from '../public/vhacd-wasm/worker/lib/comlink.mjs'

const isTouchDevice = 'ontouchstart' in window

const objLoader = new OBJLoader()

type Data = {
  vertices: Array<number>
  indices: Array<number>
}

const colors = [
  '#D24C9B',
  '#6FC6B5',
  '#FCEB07',
  '#EE336A',
  '#91479C',
  '#AFD037',
  '#EE3F22',
  '#6952A2',
  '#F68C1E',
  '#60BA46'
]

const createMeshFromData = (data: Array<Data>, colorIndex: number = 0) => {
  const group = new Group()
  data.forEach((v, i) => {
    const geometry = new THREE.BufferGeometry()

    const points: Array<Vector3> = []
    for (let i = 0; i < v.vertices.length; i += 3) {
      points.push(new Vector3(v.vertices[i + 0], v.vertices[i + 1], v.vertices[i + 2]))
    }

    geometry.setFromPoints(points)
    geometry.setIndex(v.indices)

    const object = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ color: colors[(i + colorIndex) % 6], side: THREE.DoubleSide })
    )

    const edges = new THREE.EdgesGeometry(geometry)
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: '#36454F' }))

    group.add(object)
    group.add(line)
  })

  return group
}

class MainScene extends Scene3D {
  ui!: FLAT.FlatArea
  box1!: ExtendedMesh
  vhacd_wasm!: any

  worker = new Worker('/vhacd-wasm/webworker/worker.js')

  async preload() {
    this.vhacd_wasm = Comlink.wrap(this.worker)
    await this.vhacd_wasm.init()
  }

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

    this.renderer.setPixelRatio(window.devicePixelRatio)

    // this.renderer.setSize(2560, 1440)

    console.log(this.renderer)

    const texture = new FLAT.TextTexture('hello')
    const text = new FLAT.TextSprite(texture)
    text.setPosition(size.x / 2, size.y - text.textureHeight)
    this.ui.scene.add(text)

    console.log('REVISION', THREE.REVISION)
    console.log('REVISION', REVISION)

    const { orbitControls, camera } = await this.warpSpeed('-ground')

    // this.events.on('update', () => {
    //   this.firstPersonControls.update(0, 0)
    // })

    const x = this.physics.add.box(
      { width: 40, height: 1, depth: 40, y: -2, collisionFlags: 1 },
      { lambert: { transparent: true, opacity: 1 } }
    )

    this.camera.position.set(4, 12, 8)
    this.camera.lookAt(0, 2, -4)
    this.orbitControls?.target.set(0, 2, -4)
    this.physics.debug?.enable()
    this.physics.debug?.mode(1)

    // https://poly.pizza/m/mEQj2wZ3GC

    await this.load.preload('tank', '/assets/Sail_Ship_mod.glb')

    // dissect ship (in parts)
    {
      const gltf = await this.load.gltf('tank')
      const ship = gltf.scene

      const geos: Array<BufferGeometry> = []

      ship.traverse(c => {
        if (c instanceof Mesh) {
          const geo = c.geometry.clone()
          geo.applyMatrix4(c.matrixWorld)
          geos.push(geo)
        }
      })

      const gap = 1.8
      const count = Math.round(geos.length / 2)
      const start = -(count * gap)
      geos.forEach((g, i) => {
        const mesh = new Mesh(g.clone(), this.add.material({ lambert: { color: colors[i % 6] } }))
        mesh.position.setX(start + i * gap)
        mesh.position.setY(3)
        mesh.position.setZ(-12)
        mesh.geometry.center()
        this.add.existing(mesh)
      })
    }

    // dissect ship (in groups)

    const geos: Array<BufferGeometry> = []
    {
      const gltf = await this.load.gltf('tank')
      const ship = gltf.scene

      // let geos: Array<BufferGeometry> = []

      ship.children[0].children.forEach((g, i) => {
        let _geos: Array<BufferGeometry> = []

        console.log('group', g)

        g.traverse(m => {
          if (m instanceof Mesh) {
            const geo = m.geometry.clone()
            geo.applyMatrix4(m.matrixWorld)
            _geos.push(geo)
          }
        })

        // combine geometries
        let geometries = BufferGeometryUtils.mergeGeometries(_geos)
        const combined_geometry = BufferGeometryUtils.mergeVertices(geometries)
        geos.push(combined_geometry)
      })

      const gap = 1.8
      const count = Math.round(geos.length / 2)
      const start = -(count * gap)
      geos.forEach((g, i) => {
        const mesh = new Mesh(g.clone(), this.add.material({ lambert: { color: colors[i % 6] } }))
        mesh.position.setX(start + i * gap)
        mesh.position.setY(3)
        mesh.position.setZ(-8)
        mesh.geometry.center()
        this.add.existing(mesh)
      })
    }

    const add_gltf_model = true
    const vhacd_shape = true
    const compound_of_hull_shapes = true
    const one_big_hull_shape = true
    const compound_of_vhcd_shapes = true

    // const group = new ExtendedGroup()
    // const s = this.add.sphere()
    // s.scale.set(0.3, 0.3, 0.3)
    // group.add(s)

    // group.scale.set(0.8, 0.8, 0.8)

    // this.add.existing(s)
    // this.physics.add.existing(s, { shape: 'hacd' })

    let hollow_cylinder_geo
    let hollow_cylinder_mesh
    {
      // const extrudeSettings = {
      //   depth: 0.8,
      //   steps: 1,
      //   bevelEnabled: false,
      //   curveSegments: 8
      // }
      // const arcShape = new THREE.Shape()
      // arcShape.absarc(0, 0, 3, 0, Math.PI * 2, 0, true)
      // const holePath = new THREE.Path()
      // holePath.absarc(0, 0, 2.8, 0, Math.PI * 2, true)
      // arcShape.holes.push(holePath)
      // const geo = new THREE.ExtrudeGeometry(arcShape, extrudeSettings)
      // const mat = new THREE.MeshBasicMaterial({ color: 'khaki' })
      // const mesh = new THREE.Mesh(geo, mat)
      // // geo.translate(0, 0, -1) // somehow this has an offset as well :/
      // // mesh.rotateX(Math.PI / 2)
      // // mesh.rotateY(Math.PI / 4)
      // // mesh.position.y = 3
      // mesh.scale.set(0.5, 0.5, 0.5)
      // mesh.updateMatrix()
      // mesh.updateMatrixWorld()
      // geo.center()
      // geo.applyMatrix4(mesh.matrixWorld)
      // hollow_cylinder_geo = geo
      // hollow_cylinder_mesh = mesh
      // this.add.existing(mesh)
    }

    if (one_big_hull_shape) {
      const gltf = await this.load.gltf('tank')
      const m = gltf.scene.clone(true)
      m.position.set(10, 3, 0)
      //  m.scale.set(0.5, 0.5, 0.5)
      m.rotateX(1)
      this.add.existing(m)

      //  m.scale.set(0.1, 0.1, 0.1)

      // const geos: Array<BufferGeometry> = []

      // // m.updateWorldMatrix(true, true)
      // m.traverse(c => {
      //   if (c instanceof Mesh) {
      //     const geo = c.geometry.clone()
      //     geo.applyMatrix4(c.matrixWorld)
      //     geos.push(geo)
      //   }
      // })

      // combine geometries
      let geometries = BufferGeometryUtils.mergeGeometries(geos)
      const combined_geometry = BufferGeometryUtils.mergeVertices(geometries)

      const data = getDataFromGeometry(combined_geometry)

      const computed_data = (await this.vhacd_wasm.compute_convex_hull(data.vertices)) as Data

      const mesh = createMeshFromData([computed_data])
      mesh.scale.copy(m.scale)

      mesh.position.set(10, 0, -5)

      this.add.existing(mesh)

      console.log('m.scal', m.scale)

      const collisionShape = create_hull_shape(computed_data.vertices, m.scale)

      const localTransform = this.physics.applyPosQuatScaleMargin(
        collisionShape,
        m.position.clone(),
        m.quaternion.clone(),
        m.scale
      )
      const rigidBody = this.physics.collisionShapeToRigidBody(collisionShape, localTransform, 1, false)
      this.physics.addRigidBodyToWorld(m, rigidBody)

      //  this.physics.physicsWorld.getDispatchInfo().m_enableSatConvex = true
    }

    if (vhacd_shape) {
      const gltf = await this.load.gltf('tank')
      const m = gltf.scene.clone(true)
      m.position.set(-10, 3, 0)
      // m.scale.set(0.5, 0.5, 0.5)
      //m.scale.set(0.5, 0.5, 0.5)
      m.rotateX(1)

      this.add.existing(m)

      // const _geometries: Array<BufferGeometry> = []
      // const geos: Array<BufferGeometry> = []

      // m.traverse(c => {
      //   if (c instanceof Mesh) {
      //     const geo = c.geometry.clone()
      //     geo.applyMatrix4(c.matrixWorld)
      //     geos.push(geo)
      //     //_geometries.push(geo)
      //   }
      // })
      // combine geometries
      let geometries = BufferGeometryUtils.mergeGeometries(geos)
      const combined_geometry = BufferGeometryUtils.mergeVertices(geometries)

      const data = getDataFromGeometry(combined_geometry)

      this.vhacd_wasm.compute_vhacd(data.vertices, data.indices).then(res => {
        const vhacd_data = res

        //   const vhacd_data = rust.compute_vhacd(res.vertices, res.indices) as Array<Data>

        let hull_array: Array<Ammo.btCollisionShape> = []

        vhacd_data.forEach((d, i) => {
          // if (i !== 3) return

          const mesh = createMeshFromData([d], i)
          this.add.existing(mesh)
          mesh.scale.copy(m.scale)
          mesh.position.set(-10, 0, -5)

          const { vertices, indices } = d

          const collisionShape = create_hull_shape(vertices, m.scale)
          // collisionShape.calculateTemporalAabb()

          hull_array.push(collisionShape)

          //g.dispose()
        })

        const compoundShape = this.physics.mergeCollisionShapesToCompoundShape(hull_array)
        const localTransform = this.physics.applyPosQuatScaleMargin(
          compoundShape,
          m.position.clone(),
          m.quaternion.clone()
          //m.scale
        )
        const rigidBody = this.physics.collisionShapeToRigidBody(compoundShape, localTransform, 1, false)
        this.physics.addRigidBodyToWorld(m, rigidBody)
        this.physics.physicsWorld.updateSingleAabb(rigidBody)
      })
    }

    if (compound_of_hull_shapes) {
      const gltf = await this.load.gltf('tank')
      const m = gltf.scene.clone(true)
      m.position.set(0, 3, 0)
      // m.scale.set(0.7, 0.7, 0.7)
      // m.scale.set(0.5, 0.5, 0.5)
      m.rotateX(1)
      this.add.existing(m)

      //  m.scale.set(0.1, 0.1, 0.1)

      // const geos: Array<BufferGeometry> = []

      // // m.updateWorldMatrix(true, true)
      // m.traverse(c => {
      //   if (c instanceof Mesh) {
      //     const geo = c.geometry.clone()
      //     geo.applyMatrix4(c.matrixWorld)
      //     geos.push(geo)
      //   }
      // })

      const hull_array: Array<Ammo.btCollisionShape> = []

      for (const [i, geo] of geos.entries()) {
        // if (i !== 3) return

        const { vertices, indices } = getDataFromGeometry(geo)

        const computed_data = (await this.vhacd_wasm.compute_convex_hull(vertices)) as {
          vertices: Array<number>
          indices: Array<number>
        }

        const mesh = createMeshFromData([computed_data], i)
        mesh.scale.copy(m.scale)
        mesh.position.set(0, 0, -5)

        this.add.existing(mesh)

        const collisionShape = create_hull_shape(vertices, m.scale)

        hull_array.push(collisionShape)
      }

      const compoundShape = this.physics.mergeCollisionShapesToCompoundShape(hull_array)
      const localTransform = this.physics.applyPosQuatScaleMargin(
        compoundShape,
        m.position.clone(),
        m.quaternion.clone()
        //m.scale
      )
      const rigidBody = this.physics.collisionShapeToRigidBody(compoundShape, localTransform, 1, false)
      this.physics.addRigidBodyToWorld(m, rigidBody)

      //  this.physics.physicsWorld.getDispatchInfo().m_enableSatConvex = true
    }

    if (compound_of_vhcd_shapes) {
      const gltf = await this.load.gltf('tank')
      const m = gltf.scene.clone(true)
      m.position.set(2.5, 3, 0)
      // m.scale.set(0.7, 0.7, 0.7)
      // m.scale.set(0.5, 0.5, 0.5)
      m.rotateX(1)
      this.add.existing(m)

      const hull_array: Array<Ammo.btCollisionShape> = []

      const computed_data_array: Array<Promise<Array<Data>>> = []
      for (const [i, geo] of geos.entries()) {
        const { vertices, indices } = getDataFromGeometry(geo)
        computed_data_array.push(this.vhacd_wasm.compute_vhacd(vertices, indices))
      }

      Promise.all(computed_data_array).then(computed_data_array => {
        for (const [i, computed_data] of computed_data_array.entries()) {
          // if (i !== 3) return

          const mesh = createMeshFromData(computed_data, i)
          mesh.scale.copy(m.scale)
          mesh.position.set(2.5, 0, -5)

          this.add.existing(mesh)

          computed_data.forEach(d => {
            const collisionShape = create_hull_shape(d.vertices, m.scale)

            hull_array.push(collisionShape)
          })
        }

        const compoundShape = this.physics.mergeCollisionShapesToCompoundShape(hull_array)
        const localTransform = this.physics.applyPosQuatScaleMargin(
          compoundShape,
          m.position.clone(),
          m.quaternion.clone()
          //m.scale
        )
        const rigidBody = this.physics.collisionShapeToRigidBody(compoundShape, localTransform, 1, false)
        this.physics.addRigidBodyToWorld(m, rigidBody)
        //  this.physics.physicsWorld.getDispatchInfo().m_enableSatConvex = true
      })
    }
  }
}

const startProject = () => {
  PhysicsLoader('/lib', () => new Project({ scenes: [MainScene], antialias: true }))
}

export default startProject
