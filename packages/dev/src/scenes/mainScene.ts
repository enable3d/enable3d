import { Object3D, Scene3D, ExtendedObject3D } from 'enable3d'

export default class MainScene extends Scene3D {
  sphere: Object3D
  hero: ExtendedObject3D
  robot: ExtendedObject3D
  keys: any
  gameOver: boolean
  playerCanJump: boolean
  controller: Ammo.btKinematicCharacterController
  onGround: boolean

  constructor() {
    super({ key: 'MainScene' })
  }

  init() {
    this.requestThirdDimension()
    delete this.hero
    delete this.robot
    this.gameOver = false
    this.playerCanJump = true
    this.onGround = false
  }

  create() {
    this.accessThirdDimension()
    this.third.warpSpeed()

    // this.third.physics.add.box({ y: 2, width: 1, collisionFlag: 2 })

    // enable physics debugging
    this.third.physics.debug.enable()
    this.third.physics.debug.mode(3)

    this.controller = this.third.physics.addCharacter()

    // move slowly to the right
    this.controller.setWalkDirection(new Ammo.btVector3(0.05, 0, 0))
    this.time.addEvent({
      delay: 3200,
      callback: () => {
        // @ts-ignore
        this.controller.jump()
        this.controller.setWalkDirection(new Ammo.btVector3(0, 0, 0))
      }
    })

    let box = this.third.add.box({ width: 10, x: -1 })
    box.rotateZ(Math.PI / 3)
    this.third.physics.add.existing(box)
    box.body.setCollisionFlags(2)

    // this.third.physics.add.box({ x: 4, y: 1, collisionFlag: 2 })

    // add hero
    // this.third.load.gltf('hero', object => {
    //   // get hero from object
    //   const hero = object.scene.children[0] as Object3D

    //   this.hero = this.third.new.extendedObject3D()
    //   this.hero.name = 'hero'
    //   this.hero.add(hero)

    //   this.hero.traverse((child: any) => {
    //     if (child.isMesh) child.castShadow = child.receiveShadow = true
    //   })

    //   // animation
    //   let mixer = this.third.new.animationMixer(hero)
    //   let action = mixer.clipAction(object.animations[0])
    //   action.play()

    //   this.hero.position.set(0, 2, 2)
    //   this.third.scene.add(this.hero)
    //   this.hero.scale.setX(0.02)
    //   this.hero.scale.setY(0.02)
    //   this.hero.scale.setZ(0.02)
    //   this.third.physics.add.existing(this.hero, {
    //     shape: 'box',
    //     width: 0.35,
    //     height: 0.5,
    //     depth: 0.35,
    //     offset: { y: -0.25 }
    //   })
    //   this.hero.body.setAngularFactor(0, 0, 0)

    //   // Add 3rd Person controls
    //   // this.third.controls.add.thirdPerson(this.hero, {
    //   //   targetRadius: 1.5,
    //   //   offset: this.third.new.vector3(0, 0.5, 0)
    //   // })

    //   this.hero.body.on.collision((otherObject, event) => {
    //     if (otherObject.name === 'ground') if (!this.playerCanJump && event !== 'end') this.playerCanJump = true
    //   })
    // })

    /*
    // conversion test
    // TODO does only work if x and y is set to 0
    // so we have to calculate the x and y offset

    // add 3 rectangles at the top of the screen
    // two are 2 dimensional, one is 3 dimensional
    let pps10 = this.third.getPixelsPerSquare(10)
    const { width, height } = this.cameras.main

    this.add.rectangle(width / 2 + pps10, pps10, pps10, pps10, 0xff00ff)
    const positionIn3d = this.third.transform.from2dto3d(width / 2, pps10, 10)
    this.third.add.box({ ...positionIn3d })

    let ppsM5 = this.third.getPixelsPerSquare(-5)
    this.third.add.box({ x: 10, y: 3, z: -5 })
    const positionIn2d = this.third.transform.from3dto2d(this.third.new.vector3(10, 3, -5))
    this.add.rectangle(positionIn2d.x + ppsM5, positionIn2d.y, ppsM5, ppsM5, 0xff00ff)

    // add phaser texts
    // one in the front
    // and another in the back with a depth or <= -1
    this.add.text(10, 10, 'Text in Front', { color: 0x00ff00, fontSize: '50px' })
    this.add
      .text(this.cameras.main.width - 10, 10, 'Text in Back', { color: 0x00ff00, fontSize: '50px' })
      .setOrigin(1, 0)
      .setDepth(-1)
    */
  }

  update(time) {
    // if (Math.random() > 0.1) console.log(this.controller.onGround())
    // if (time > 5000 && this.controller.onGround() && !this.onGround) {
    //   this.onGround = true
    //   this.controller.setGravity(0)
    //   console.log('gravity to 0')
    // } else if (!this.controller.onGround() && this.onGround) {
    //   this.onGround = false
    //   this.controller.setGravity(9.8)
    //   console.log('gravity to 9.8')
    // }
  }
}
