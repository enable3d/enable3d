import { Object3D, Scene3D, ExtendedObject3D, Vector3 } from 'enable3d'

export default class MainScene extends Scene3D {
  sphere: Object3D
  hero: ExtendedObject3D
  robot: ExtendedObject3D
  keys: any
  gameOver: boolean
  playerCanJump: boolean
  controller: Ammo.btKinematicCharacterController
  onGround: boolean
  lookAt: Vector3

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
    this.third.camera.position.set(-2.5, 5.5, 8)
    this.third.camera.lookAt(-1, 0, 0)
    this.lookAt = this.third.new.vector3(0, 0, 0)

    // this.third.physics.add.box({ y: 2, width: 1, collisionFlag: 2 })

    // enable physics debugging
    this.third.physics.debug.enable()
    // this.third.physics.debug.mode(3)

    this.controller = this.third.physics.addCharacter()

    // move slowly to the right
    this.controller.setWalkDirection(new Ammo.btVector3(0.05, 0, 0))
    // this.time.addEvent({
    //   delay: 3200,
    //   callback: () => {
    //     // @ts-ignore
    //     this.controller.jump()
    //     this.controller.setWalkDirection(new Ammo.btVector3(0, 0, 0))
    //   }
    // })

    const addStairs = true
    const flag = 2

    if (addStairs) {
      this.third.physics.add.box({ height: 0.1, width: 3, x: -4, y: 0.05, collisionFlag: flag })
      this.third.physics.add.box({ height: 0.1, width: 2.8, x: -4, y: 0.15, collisionFlag: flag })
      this.third.physics.add.box({ height: 0.1, width: 2.6, x: -4, y: 0.25, collisionFlag: flag })
      this.third.physics.add.box({ height: 0.1, width: 2.4, x: -4, y: 0.35, collisionFlag: flag })
      this.third.physics.add.box({ height: 0.1, width: 2.2, x: -4, y: 0.45, collisionFlag: flag })
      this.third.physics.add.box({ height: 0.1, width: 2, x: -4, y: 0.55, collisionFlag: flag })
      this.third.physics.add.box({ height: 0.1, width: 1.8, x: -4, y: 0.65, collisionFlag: flag })
      this.third.physics.add.box({ height: 0.1, width: 1.6, x: -4, y: 0.75, collisionFlag: flag })
      this.third.physics.add.box({ height: 0.1, width: 1.4, x: -4, y: 0.85, collisionFlag: flag })

      this.third.physics.add.box({ height: 0.2, width: 3, x: 0.5, y: 0.1, collisionFlag: flag })
      this.third.physics.add.box({ height: 0.2, width: 2.6, x: 0.5, y: 0.3, collisionFlag: flag })
      this.third.physics.add.box({ height: 0.2, width: 2.2, x: 0.5, y: 0.5, collisionFlag: flag })
      this.third.physics.add.box({ height: 0.2, width: 1.8, x: 0.5, y: 0.7, collisionFlag: flag })
      this.third.physics.add.box({ height: 0.2, width: 1.4, x: 0.5, y: 0.9, collisionFlag: flag })
      this.third.physics.add.box({ height: 0.2, width: 1, x: 0.5, y: 1.1, collisionFlag: flag })

      this.third.physics.add.box({ height: 0.3, width: 3, x: 5, y: 0.15, collisionFlag: flag })
      this.third.physics.add.box({ height: 0.3, width: 2.2, x: 5, y: 0.45, collisionFlag: flag })
      this.third.physics.add.box({ height: 0.3, width: 1.6, x: 5, y: 0.75, collisionFlag: flag })
      this.third.physics.add.box({ height: 0.3, width: 1, x: 5, y: 1.05, collisionFlag: flag })
      this.third.physics.add.box({ height: 0.3, width: 0.4, x: 5, y: 1.35, collisionFlag: flag })
    }

    // let box = this.third.add.box({ width: 10, x: -1 })
    // box.rotateZ(Math.PI / 5)
    // this.third.physics.add.existing(box)
    // box.body.setCollisionFlags(2)

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
    const t = this.controller.getGhostObject().getWorldTransform()
    const p = t.getOrigin()

    const v = this.third.new.vector3(p.x(), p.y(), p.z())
    this.lookAt.lerp(v, 0.05)
    this.third.camera.lookAt(this.lookAt)
    // const r = this.getRotation(t)
    // const theta = r.y
    // const speed = 1 / 30
    // const x = Math.sin(theta) * speed,
    //   y = 0,
    //   z = Math.cos(theta) * speed
    // this.controller.setWalkDirection(new Ammo.btVector3(x, y, z))
    // const forwardDir = t.getBasis().getRotation()
    // if (Math.random() > 0.1) console.log(forwardDir)
    // const e = this.third.new.euler(0, (1 * time) / 1000, 0)
    // const q = this.third.new.quaternion(0, 0, 0, 1)
    // q.setFromEuler(e)
    // const ammoQuat = new Ammo.btQuaternion(0, 0, 0, 1)
    // ammoQuat.setValue(q.x, q.y, q.z, q.w)
    // t.setRotation(ammoQuat)
  }
}
