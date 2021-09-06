import { ExtendedObject3D, PhysicsLoader, Project, Scene3D, THREE } from 'enable3d'

class MainScene extends Scene3D {
  leftArm: ExtendedObject3D
  rightArm: ExtendedObject3D

  async create() {
    this.physics.debug?.enable()

    const { orbitControls } = await this.warpSpeed()
    orbitControls?.target.set(0, 2, 0)
    this.camera.lookAt(0, 2, 0)

    const box = this.make.box({ x: 0.2, y: 5, name: 'box' })
    box.rotateY(1)
    box.rotateX(1)
    this.add.existing(box)
    this.physics.add.existing(box)

    this.leftArm = this.physics.add.box({ mass: 100, x: -2, y: 1, height: 2, width: 0.2, depth: 2, collisionFlags: 2 })
    this.leftArm.body.setFriction(1)
    this.leftArm.userData.move = true

    this.rightArm = this.physics.add.box({ mass: 100, x: 2, y: 1, height: 2, width: 0.2, depth: 2, collisionFlags: 2 })
    this.rightArm.body.setFriction(1)
    this.rightArm.userData.move = true

    this.leftArm.body.on.collision((otherObject, event) => {
      if (otherObject.name === 'box' && event === 'start') this.leftArm.userData.move = false
      else if (otherObject.name === 'box' && event === 'end') this.leftArm.userData.move = true
    })

    this.rightArm.body.on.collision((otherObject, event) => {
      if (otherObject.name === 'box' && event === 'start') this.rightArm.userData.move = false
      else if (otherObject.name === 'box' && event === 'end') this.rightArm.userData.move = true
    })
  }

  update(time: number) {
    if (time < 2) return

    if (this.leftArm.userData.move) this.leftArm.position.x += 0.01
    if (this.rightArm.userData.move) this.rightArm.position.x -= 0.01

    if (!this.leftArm.userData.move && !this.rightArm.userData.move) {
      this.rightArm.position.y += 0.01
      this.leftArm.position.y += 0.01
    }

    this.rightArm.body.needUpdate = true
    this.leftArm.body.needUpdate = true
  }
}

const startProject = () => {
  PhysicsLoader('/lib/kripken', () => new Project({ scenes: [MainScene], softBodies: true }))
}

export default startProject
