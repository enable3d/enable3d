import { ExtendedObject3D, FLAT, PhysicsLoader, Project, Scene3D, THREE } from 'enable3d'
import { REVISION } from 'three'
import { FlatArea } from '../../threeGraphics/jsm/flat'
import { Tap } from '@yandeu/tap'
import { timeStamp } from 'console'

class MainScene extends Scene3D {
  maze: ExtendedObject3D[] = []

  async preload() {
    // https://sketchfab.com/3d-models/1-maze-fcdbe9bbbce74cdd9991b5a1a041001e
    this.load.preload('maze', '/assets/maze/scene.gltf')
  }

  async create() {
    await this.warpSpeed('-ground', '-orbitControls')

    this.camera.position.set(0, 4, 5)
    this.camera.lookAt(0, 0, 0)

    // this.physics.debug?.enable()

    const immovable = ['Wall']
    const handles = ['Handle', 'Handle_1']
    const maze = ['Cube001']
    const mazeGround = ['Main001']

    const maxLevel = 5
    const searchMesh = (obj: THREE.Object3D, level = 0) => {
      if (level > maxLevel) return

      if (obj.type === 'Object3D') {
        obj.traverse(child => {
          searchMesh(child, (level += 1))
        })
      }

      if (obj.type === 'Mesh') {
        const mesh = obj as ExtendedObject3D
        const parent = obj.parent as any

        if (maze.includes(parent.name)) {
          if (!mesh.hasBody) {
            // // console.log(mesh)
            // mesh.position.x -= offset.x
            // mesh.position.y += offset.z

            this.physics.add.existing(mesh, {
              collisionFlags: 2,
              collisionGroup: 2,
              collisionMask: parseInt('0001'),
              shape: 'concave',
              autoCenter: true // reset center of gravity
            })
            const offset = { x: 1.5, z: -1.75 }
            mesh.position.x -= offset.x
            mesh.position.y += offset.z
            mesh.body.needUpdate = true
            this.maze.push(mesh)
          }
        }

        if (mazeGround.includes(parent.name)) {
          if (!mesh.hasBody) {
            // console.log(mesh)
            // mesh.position.x -= offset.x
            // mesh.position.y += offset.z
            this.physics.add.existing(mesh, {
              collisionFlags: 2,
              collisionGroup: 2,
              collisionMask: parseInt('0001'),
              shape: 'concave'
            })
            this.maze.push(mesh)
          }
        }
      }
    }

    const gltf = await this.load.gltf('maze')

    gltf.scenes[0].traverse(child => {
      searchMesh(child)
    })

    this.add.existing(gltf.scenes[0])

    // ball
    this.physics.add.sphere({ y: 1, radius: 0.1 })

    // tap
    const tap = new Tap(this.renderer.domElement)

    tap.on.move(({ position, event, dragging }) => {
      if (!dragging) return
      const { movementX, movementY } = event as PointerEvent

      if (this.maze.length < 2) return

      this.maze.forEach(m => {
        m.rotation.x += movementY / 1000
        m.rotation.y += movementX / 1000
        m.body.needUpdate = true
      })
    })
  }

  update(_time: number, _delta: number): void {}
}

const startProject = () => {
  PhysicsLoader('/lib', () => new Project({ scenes: [MainScene], maxSubSteps: 4, fixedTimeStep: 1 / 120 }))
}

export default startProject
