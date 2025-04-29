/// <reference types="../../common/src/typesAmmo.d.ts" />

import { createHACDShapes, ExtendedGroup } from '@enable3d/ammo-physics'
import { createCollisionShapes, createHullShape, iterateGeometries } from '@enable3d/ammo-physics/dist/three-to-ammo.js'
import { group } from 'console'
import { ExtendedMesh, ExtendedObject3D, FLAT, PhysicsLoader, Project, Scene3D, THREE } from 'enable3d'
import { Scale } from 'phaser'
import { BufferGeometry, Matrix4, Mesh, MeshStandardMaterial, Quaternion, REVISION, Vector3 } from 'three'
import { ConvexGeometry } from 'three/examples/jsm/Addons.js'
import { ConvexHull, VertexNode } from 'three/examples/jsm/math/ConvexHull.js'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'

const isTouchDevice = 'ontouchstart' in window

export function getDataFromGeometry(geometry: THREE.BufferGeometry) {
  // https://discourse.threejs.org/t/transform-three-js-mesh-to-mesh-object-mesh-vertices-indices/47309/2
  const position = geometry.getAttribute('position')
  const vertices: Vector3[] = []
  for (let i = 0; i < position.count; i += 3) {
    const vertex = new Vector3()
    vertex.fromBufferAttribute(position, i) // read vertex
    vertices.push(vertex)
  }

  let indices: number[] = []
  if (geometry.index) {
    indices = Array.from(geometry.index.array)
  } else if (geometry.attributes.index) {
    indices = Array.from(geometry.attributes.index.array)
  } else if (geometry.index === null) {
    for (let i = 0; i < vertices.length; i++) {
      indices.push(i)
    }
  }
  return { vertices, indices }
}

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
      { lambert: { transparent: true, opacity: 0.5 } }
    )

    this.camera.position.set(4, 2, 8)
    this.camera.lookAt(0, -1, 0)
    orbitControls?.target.set(0, -1, 0)
    this.physics.debug?.enable()
    this.physics.debug?.mode(15)

    this.load.gltf('/assets/Tank.glb').then(gltf => {
      const meshes: Array<Mesh> = []

      const add_gltf_model = true
      const compound_of_hacd = true

      if (add_gltf_model) {
        const m = gltf.scene.clone(true)
        this.add.existing(gltf.scene)
        //  gltf.scene.position.x - 2
      }

      if (compound_of_hacd) {
        const m = gltf.scene.clone(true)

        const geometries: Array<BufferGeometry> = []

        m.traverse(c => {
          if (c.isMesh) {
            const geo = c.geometry.clone()
            geo.applyMatrix4(c.matrixWorld)
            geometries.push(geo)
          }
        })

        m.position.set(-1, 3, 1)
        m.scale.set(0.5, 0.5, 0.5)
        m.rotateX(1)

        const btVertex = new Ammo.btVector3()
        const vertex = new THREE.Vector3()

        const hull_array = []
        geometries.forEach((g, i) => {
          // if (i !== 3) return

          const { vertices, indices: indexes } = getDataFromGeometry(g)

          const vector = new Vector3()
          const center = new Vector3()
          const matrix = new Matrix4()

          const hacd = new Ammo.HACD()

          let vertexCount = vertices.length
          let triCount = indexes.length

          console.log(vertexCount, triCount)

          const points = Ammo._malloc(vertexCount * 3 * 8)
          const triangles = Ammo._malloc(triCount * 3 * 4)
          hacd.SetPoints(points)
          hacd.SetTriangles(triangles)
          hacd.SetNPoints(vertexCount)
          hacd.SetNTriangles(triCount)

          let pptr = points / 8,
            tptr = triangles / 4

          {
            const components = vertices
            matrix.fromArray(new Matrix4().scale(new Vector3(1, 1, 1)).toArray())
            for (let j = 0; j < components.length; j++) {
              vector.set(components[j].x, components[j].y, components[j].z).applyMatrix4(matrix).sub(center)
              Ammo.HEAPF64[pptr + 0] = vector.x
              Ammo.HEAPF64[pptr + 1] = vector.y
              Ammo.HEAPF64[pptr + 2] = vector.z
              pptr += 3
            }
            if (indexes) {
              const indices = indexes
              for (let j = 0; j < indices.length; j++) {
                Ammo.HEAP32[tptr] = indices[j]
                tptr++
              }
            } else {
              for (let j = 0; j < components.length; j++) {
                Ammo.HEAP32[tptr] = j
                tptr++
              }
            }
          }

          hacd.Compute()
          Ammo._free(points)
          Ammo._free(triangles)
          const nClusters = hacd.GetNClusters()

          console.log('nClusters', nClusters)

          // const shapes = []
          for (let i = 0; i < nClusters; i++) {
            const hull = new Ammo.btConvexHullShape()
            hull.setMargin(0.01)
            const nPoints = hacd.GetNPointsCH(i)
            const nTriangles = hacd.GetNTrianglesCH(i)
            const hullPoints = Ammo._malloc(nPoints * 3 * 8)
            const hullTriangles = Ammo._malloc(nTriangles * 3 * 4)
            hacd.GetCH(i, hullPoints, hullTriangles)

            const pptr = hullPoints / 8
            for (let pi = 0; pi < nPoints; pi++) {
              const btVertex = new Ammo.btVector3()
              const px = Ammo.HEAPF64[pptr + pi * 3 + 0]
              const py = Ammo.HEAPF64[pptr + pi * 3 + 1]
              const pz = Ammo.HEAPF64[pptr + pi * 3 + 2]
              btVertex.setValue(px, py, pz)
              hull.addPoint(btVertex, pi === nPoints - 1)
              Ammo.destroy(btVertex)
            }

            //_finishCollisionShape(hull, options, scale)
            hull_array.push(hull)
          }
          g.dispose()
        })

        this.add.existing(m)

        // this.physics.createCollisionShape("hacd", )
        const compoundShape = this.physics.mergeCollisionShapesToCompoundShape(hull_array)
        const localTransform = this.physics.applyPosQuatScaleMargin(
          compoundShape,
          m.position.clone(),
          m.quaternion.clone(),
          m.scale.clone()
        )
        const rigidBody = this.physics.collisionShapeToRigidBody(compoundShape, localTransform, 1, false)
        this.physics.addRigidBodyToWorld(m, rigidBody)
        return
      }
    })
  }
}

const startProject = () => {
  PhysicsLoader('/lib', () => new Project({ scenes: [MainScene] }))
}

export default startProject
