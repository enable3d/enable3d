import { ExtendedObject3D, PhysicsLoader, Project, Scene3D, THREE } from 'enable3d'

import { TypeBufferGeometry, processGeometry } from '@enable3d/ammo-physics/dist/tmp'
import { Material, Object3D, Quaternion, SkinnedMesh, Vector3 } from 'three'
import { Vector } from 'matter'
import { timeStamp } from 'console'

class MainScene extends Scene3D {
  leftArm: ExtendedObject3D
  rightArm: ExtendedObject3D

  async create() {
    this.physics.debug?.enable()

    this.warpSpeed()

    this.physics.add.box({ x: 0, y: 1, name: 'box' })

    this.leftArm = this.physics.add.box({ mass: 100, x: -1.2, y: 3, height: 5, width: 0.2, collisionFlags: 2 })
    this.leftArm.body.setFriction(1)
    this.leftArm.userData.move = true

    this.rightArm = this.physics.add.box({ mass: 100, x: 1.2, y: 3, height: 5, width: 0.2, collisionFlags: 2 })
    this.rightArm.body.setFriction(1)
    this.rightArm.userData.move = true

    this.leftArm.body.on.collision(otherObject => {
      if (otherObject.name === 'box') this.leftArm.userData.move = false
    })

    this.rightArm.body.on.collision(otherObject => {
      if (otherObject.name === 'box') this.rightArm.userData.move = false
    })
  }

  update(time: number) {
    if (time > 1 && time < 2.5) {
      if (this.rightArm.userData.move) this.rightArm.position.x -= 0.01
      if (this.leftArm.userData.move) this.leftArm.position.x += 0.01

      this.rightArm.body.needUpdate = true
      this.leftArm.body.needUpdate = true
    }

    if (time > 3) {
      this.rightArm.position.y += 0.01
      this.leftArm.position.y += 0.01

      this.rightArm.body.needUpdate = true
      this.leftArm.body.needUpdate = true
    }
  }
}

const startProject = () => {
  PhysicsLoader('/lib/kripken', () => new Project({ scenes: [MainScene], softBodies: true }))
}

export default startProject
