import { Scene3D, Object3D, ExtendedObject3D, THREE } from '@enable3d/phaser-extension'

export default class MainScene extends Scene3D {
  constructor() {
    super({ key: 'MainScene' })
  }

  init() {
    this.requestThirdDimension()
  }

  create() {
    this.accessThirdDimension()
    this.third.warpSpeed()

    this.third.physics.add.box({ x: -2, y: 5 })
    this.third.physics.add.box({ x: 2, y: 5 }).body.setGravity(0, -1, 0)
  }

  update() {}
}
