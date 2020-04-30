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

    this.third.physics.debug?.enable()

    let blueBox = this.third.physics.add.box({ y: 5 }, { lambert: { color: 'cornflowerblue' } })
    let redBox = this.third.physics.add.box({ y: 15 }, { lambert: { color: 'tomato' } })

    // console.log()
    setTimeout(() => console.log('BOX:', typeof blueBox.body, blueBox.hasBody), 500)

    // destroy the body after 1 second
    setTimeout(() => this.third.physics.destroy(blueBox.body), 1000)

    // console.log()
    setTimeout(() => console.log('BOX:', typeof blueBox.body, blueBox.hasBody), 1500)

    // re-add a body after 2.5 seconds
    setTimeout(() => this.third.physics.add.existing(blueBox), 2500)

    // destroy object and its body after 4.5 seconds
    setTimeout(() => this.third.destroy(blueBox), 4500)

    // destroy object and its body after 6 seconds
    setTimeout(() => this.third.destroy(this.third.ground), 6000)
  }

  update() {}
}
