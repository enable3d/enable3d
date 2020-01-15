import { Object3D, Scene3D, ExtendedObject3D } from 'enable3d'

export default class MainScene extends Scene3D {
  sphere: Object3D
  hero: ExtendedObject3D
  robot: ExtendedObject3D
  keys: any
  gameOver: boolean
  playerCanJump: boolean

  constructor() {
    super({ key: 'MainScene' })
  }

  init() {
    this.requestThirdDimension()
    delete this.hero
    delete this.robot
    this.gameOver = false
    this.playerCanJump = true
  }

  create() {
    this.accessThirdDimension()
    this.third.warpSpeed()
    this.third.haveSomeFun(50)

    this.third.add.box({ y: 0.5, width: 1 })

    // enable physics debugging
    // this.third.physics.debug.enable()
    // this.third.physics.debug.mode(3)

    // add hero
    this.third.load.gltf('hero', object => {
      // get hero from object
      const hero = object.scene.children[0] as Object3D

      this.hero = this.third.new.extendedObject3D()
      this.hero.name = 'hero'
      this.hero.add(hero)

      this.hero.traverse((child: any) => {
        if (child.isMesh) child.castShadow = child.receiveShadow = true
      })

      // animation
      let mixer = this.third.new.animationMixer(hero)
      let action = mixer.clipAction(object.animations[0])
      action.play()

      this.hero.position.set(0, 2, 2)
      this.third.scene.add(this.hero)
      this.hero.scale.setX(0.02)
      this.hero.scale.setY(0.02)
      this.hero.scale.setZ(0.02)
      this.third.physics.add.existing(this.hero, { width: 0.35, height: 0.5, depth: 0.35 })
      this.hero.body.setAngularFactor(0, 0, 0)

      // Add 3rd Person controls
      this.third.controls.add.thirdPerson(this.hero, {
        targetRadius: 1.5,
        offset: this.third.new.vector3(0, 0.5, 0)
      })

      this.hero.body.on.collision((otherObject, event) => {
        if (otherObject.name === 'ground') if (!this.playerCanJump && event !== 'end') this.playerCanJump = true
      })
    })

    // constraint test (spring)
    let box1 = this.third.physics.add.box({ x: 10, z: 16, y: 20 }, { standard: { color: 0xff00ff } })
    let box2 = this.third.physics.add.box(
      { x: 10, z: 17, y: 15, collisionFlag: 4, mass: 5 },
      { standard: { color: 0xffff00 } }
    )
    this.third.physics.add.constraints.spring(box1.body, box2.body, { angularLock: false })

    this.keys = {
      a: this.input.keyboard.addKey('a'),
      w: this.input.keyboard.addKey('w'),
      d: this.input.keyboard.addKey('d'),
      s: this.input.keyboard.addKey('s'),
      space: this.input.keyboard.addKey(32)
    }

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

  update(time, delta) {
    if (this.hero && this.hero.body) {
      if (this.gameOver) {
        // camera shake effect
        this.third.camera.position.x += (Math.random() - 0.5) / 5
        this.third.camera.position.y += (Math.random() - 0.5) / 5
        this.third.camera.position.z += (Math.random() - 0.5) / 5
      }

      if (!this.gameOver && this.hero.position.y < -10) {
        this.gameOver = true
        this.time.addEvent({ delay: 1000, callback: () => this.scene.restart() })
      }

      if (this.keys.space.isDown && this.playerCanJump) {
        this.playerCanJump = false
        this.hero.body.applyForceY(1)
      }

      if (this.keys.s.isDown) {
        this.hero.position.x += 1
      }

      if (this.keys.w.isDown) {
        const speed = 3
        const rotation = this.hero.getWorldDirection(this.hero.rotation.toVector3())
        const theta = Math.atan2(rotation.x, rotation.z)

        const x = Math.sin(theta) * speed,
          y = this.hero.body.velocity.y,
          z = Math.cos(theta) * speed

        this.hero.body.setVelocity(x, y, z)
      }

      if (this.keys.a.isDown) this.hero.body.setAngularVelocityY(2)
      else if (this.keys.d.isDown) this.hero.body.setAngularVelocityY(-2)
      else this.hero.body.setAngularVelocityY(0)
    }
  }
}
