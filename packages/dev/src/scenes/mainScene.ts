import { Scene3D, Object3D, ExtendedObject3D } from '@enable3d/phaser-extension'

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

    this.third.physics.debug.enable()

    this.third.physics.add.box({ y: 2 })
  }

  update() {}
}
