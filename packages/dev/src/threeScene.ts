import { Project, Scene3D, PhysicsLoader, ExtendedObject3D } from 'enable3d'
import { Vehicle } from '@enable3d/ammo-physics/dist/vehicle'

const isTouchDevice = 'ontouchstart' in window

class MainScene extends Scene3D {
  car: Vehicle

  async create() {
    this.warpSpeed('-ground')

    this.camera.position.set(0, 5, -5)
    this.camera.lookAt(0, 0, 0)
    this.physics.debug?.enable()

    this.physics.add.ground({ y: -1, width: 50, height: 50 })

    const chassis = this.physics.add.box({ depth: 3, height: 0.8, width: 1.5, mass: 800 })

    const wheelMesh = this.make.cylinder({
      radiusBottom: 0.4,
      radiusTop: 0.4,
      height: 0.2,
      radiusSegments: 12
    })

    this.car = new Vehicle(this.scene, this.physics, chassis, wheelMesh)
  }

  update() {
    this.car.update()
  }
}

const startProject = () => {
  PhysicsLoader('/lib', () => new Project({ scenes: [MainScene] }))
}

export default startProject
