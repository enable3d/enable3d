import { Scene3D, ExtendedObject3D, THREE } from '@enable3d/phaser-extension'
import { ClosestRaycaster, AllHitsRaycaster } from '@enable3d/ammo-physics'

export default class MainScene extends Scene3D {
  constructor() {
    super({ key: 'MainScene' })
  }

  init() {
    this.accessThirdDimension({ enableXR: false })
  }

  create() {
    this.third.warpSpeed()

    let box = this.third.physics.add.box({ y: 10 })

    setTimeout(() => {
      this.third.destroy(box)
    }, 5000)
  }

  update() {}
}
