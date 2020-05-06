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

    this.third.add.water({
      y: 1
    })
  }

  update() {}
}
