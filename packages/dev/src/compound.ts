import { ExtendedObject3D, PhysicsLoader, Project, Scene3D, THREE } from 'enable3d'

import { TypeBufferGeometry, processGeometry } from '@enable3d/ammo-physics/dist/tmp'
import { Material, Object3D, Quaternion, SkinnedMesh, Vector3 } from 'three'
import { Vector } from 'matter'
import { timeStamp } from 'console'

class MainScene extends Scene3D {
  async create() {
    this.warpSpeed()

    this.physics?.debug?.enable()

    const box1 = this.make.box()
    const box2 = this.make.box({ y: 0.2, x: 0.6, z: -0.1 })

    const box = new ExtendedObject3D()
    box.add(box1, box2)
    box.position.setY(5)
    this.add.existing(box)
    this.physics.add.existing(box)

    // add suzanne (the monkey's name is suzanne)
    this.load.gltf('/assets/suzanne.glb').then(gltf => {
      // If you can, always use simple shapes like BOX, SPHERE, CONE etc.
      // The second most efficient shape is a COMPOUND, which merges multiple simple shapes.
      // Prefer HULL over CONVEX MESH.
      // HACD is the most expensive but also the most accurate.
      // If you need a concave shape, for a static or kinematic body, use CONCAVE MESH.

      // (mesh and convex are aliases for convexMesh)
      // (concave is an alias for concaveMesh)
      // (heightMap uses concaveMesh by default)
      // (extrude uses hacd by default)

      const suzanne = gltf.scene.children[0]

      const shapes = ['box', 'hull', 'compound', 'hacd', 'convexMesh', 'concaveMesh']

      const material = this.add.material({ phong: { color: 0xc4c4c4, transparent: true, opacity: 0.5 } })
      const boxShape = { shape: 'box', width: 2, height: 1.5, depth: 1.25 }

      // compound multiple simple shape together
      const compoundShape = {
        compound: [
          // nose
          { shape: 'box', width: 0.5, height: 1, depth: 0.4, y: -0.5, z: 0.5 },
          // ears
          { shape: 'box', width: 2.4, height: 0.6, depth: 0.4, z: -0.4, y: 0.2 },
          // head back
          { shape: 'sphere', radius: 0.65, z: -0.25, y: 0.35 },
          // head front
          { shape: 'box', width: 1.5, height: 0.8, depth: 1, y: 0.2, z: 0.2 }
        ]
      }

      suzanne.traverse(child => {
        // @ts-ignore
        if (child.isMesh && child.material.isMaterial) {
          // @ts-ignore

          child.material = material
        }
      })

      shapes.forEach((shape, i) => {
        const object = new ExtendedObject3D()

        object.add(suzanne.clone(true))
        object.position.set(i * 3 - 7.5, 1.2, 0)
        console.log(object.position)

        // we se addChildren to false since we do not want
        // to create a body from suzanne's child meshes
        // (it would create a box 1x1x1 since no matching shape would be found)
        let options = { addChildren: false, shape }

        if (shape === 'box') options = { ...options, ...boxShape }
        else if (shape === 'compound') options = { ...options, ...compoundShape }

        this.add.existing(object)
        this.physics.add.existing(object, options)
      })
    })
  }
}

const startProject = () => {
  PhysicsLoader('/lib', () => new Project({ scenes: [MainScene] }))
}

export default startProject
