import { Project, Scene3D, PhysicsLoader, ExtendedObject3D } from 'enable3d'
import { Vehicle } from '@enable3d/ammo-physics/dist/vehicle'

const isTouchDevice = 'ontouchstart' in window

class MainScene extends Scene3D {
  car: Vehicle

  async create() {
    this.warpSpeed('-ground')

    this.camera.position.set(2, 2, 4)
    this.physics.debug?.enable()

    this.physics.add.ground({ y: -1, width: 500, height: 500 })

    const chassis = this.physics.add.box({ depth: 3, height: 0.8, width: 1.5 })

    const wheelMesh = this.make.cylinder({ radiusBottom: 0.4, radiusTop: 0.4, height: 0.2 })

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
