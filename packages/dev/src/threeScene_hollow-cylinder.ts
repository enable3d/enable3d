/// <reference types="../../common/src/typesAmmo.d.ts" />

import { ExtendedMesh, FLAT, PhysicsLoader, Project, Scene3D, THREE } from 'enable3d'
import { BufferAttribute, BufferGeometry, Group, Mesh, REVISION, Vector3 } from 'three'

import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { getDataFromGeometry, getDataFromMesh } from './threeScene_2.js'

import { create_hull_shape } from './shape_hull.js'

import * as Comlink from '../public/vhacd-wasm/worker/lib/comlink.mjs'

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
  fly!: FlyControls
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

    const add_gltf_model = false
    const vhacd_shape = false
    const compound_of_hull_shapes = false
    const one_big_hull_shape = false
    const compound_of_vhcd_shapes = false

    let hollow_cylinder_geo
    let hollow_cylinder_mesh
    {
      const extrudeSettings = {
        depth: 0.8,
        steps: 1,
        bevelEnabled: false,
        curveSegments: 16
      }
      const arcShape = new THREE.Shape()
      arcShape.absarc(0, 0, 4, 0, Math.PI * 2, 0, true)
      const holePath = new THREE.Path()
      holePath.absarc(0, 0, 3.5, 0, Math.PI * 2, true)
      arcShape.holes.push(holePath)
      const geo1 = new THREE.ExtrudeGeometry(arcShape, extrudeSettings)
      const mat = new THREE.MeshBasicMaterial({ color: 'khaki' })
      const mesh = new THREE.Mesh(geo1, mat)
      mesh.position.setY(4)
      // geo1.applyMatrix4(mesh.matrixWorld)

      const sphere = this.add.sphere({ radius: 0.2 })
      sphere.position.set(0, 0, -2)
      this.physics.add.existing(sphere)

      mesh.scale.set(0.5, 0.5, 0.5)

      //  mesh.updateMatrix()

      let geo = BufferGeometryUtils.mergeGeometries([geo1])
      geo = BufferGeometryUtils.mergeVertices(geo)
      geo.applyMatrix4(mesh.matrixWorld)
      hollow_cylinder_geo = geo
      hollow_cylinder_mesh = mesh
      this.add.existing(mesh)

      const data = getDataFromGeometry(geo)

      const resolutions = [32, 64, 128, 256]

      for (const [index, r] of resolutions.entries()) {
        this.vhacd_wasm.compute_vhacd(data.vertices, data.indices, r).then(computed_data => {
          let hull_array: Array<Ammo.btCollisionShape> = []

          computed_data.forEach((d, i) => {
            // if (i !== 3) return

            const mesh1 = createMeshFromData([d], i)
            this.add.existing(mesh1)
            mesh1.position.copy(mesh.position)
            mesh1.scale.copy(mesh.scale)
            mesh1.position.setZ(index * 2 - 4)
            mesh1.position.setX(-3)

            const { vertices, indices } = d

            const collisionShape = create_hull_shape(vertices, mesh.scale)
            // collisionShape.calculateTemporalAabb()

            hull_array.push(collisionShape)

            //g.dispose()
          })

          const compoundShape = this.physics.mergeCollisionShapesToCompoundShape(hull_array)

          const localTransform = this.physics.applyPosQuatScaleMargin(
            compoundShape,
            mesh.position.clone(),
            mesh.quaternion.clone()
            // mesh.scale
          )
          const rigidBody = this.physics.collisionShapeToRigidBody(compoundShape, localTransform, 1, false)
          this.physics.physicsWorld.addRigidBody(rigidBody)
          // this.physics.addRigidBodyToWorld(mesh1, rigidBody)
        })
      }
    }
  }
}

const startProject = () => {
  PhysicsLoader('/lib', () => new Project({ scenes: [MainScene], antialias: true }))
}

export default startProject
