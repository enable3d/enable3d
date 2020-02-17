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
  platform: ExtendedObject3D
  player: ExtendedObject3D

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
    this.third.warpSpeed('-ground')
    this.third.camera.position.set(0, 6, 10)
    this.third.camera.lookAt(-1, 0, 0)
    this.lookAt = this.third.new.vector3(0, 0, 0)

    // this.third.physics.add.box({ y
    // enable physics debugging
    this.third.physics.debug.enable()
    this.third.physics.debug.mode(3)

    // @ts-ignore
    this.player = this.third.physics.add.cylinder({ name: 'player', controller: true })
    // cylinder.controller.get

    this.third.physics.add.box({ z: -5, collisionFlags: 1 })
    this.third.physics.add.box({ z: -5, y: 5 })

    // @ts-ignore
    // this.third.physics.add.existing(cylinder, { controller: true })§

    // move slowly to the right
    // this.controller.setWalkDirection(new Ammo.btVector3(0, 0, 0))
    // this.time.addEvent({
    //   delay: 3200,
    //   callback: () => {
    //     // @ts-ignore
    //     this.controller.jump()
    //     this.controller.setWalkDirection(new Ammo.btVector3(0, 0, 0))
    //   }
    // })
    this.platform = this.third.add.box({ width: 8, height: 0.1, depth: 6 })
    this.platform.rotateZ(0.2)
    this.third.physics.add.existing(this.platform, { collisionFlags: 2 })
    this.platform.userData.speedX = 0.0075
    this.platform.body.on.collision(other => {
      this.platform.userData.onPlatform = true
    })

    this.keys = {
      a: this.input.keyboard.addKey('a'),
      w: this.input.keyboard.addKey('w'),
      d: this.input.keyboard.addKey('d'),
      s: this.input.keyboard.addKey('s'),
      space: this.input.keyboard.addKey(32)
    }

    const addStairs = false
    const flag = 1
    const mass = 0.01

    if (addStairs) {
      this.third.physics.add.box({ mass: mass, height: 0.1, width: 3, x: -4, y: 0.05, collisionFlags: flag })
      this.third.physics.add.box({ mass: mass, height: 0.1, width: 2.8, x: -4, y: 0.15, collisionFlags: flag })
      this.third.physics.add.box({ mass: mass, height: 0.1, width: 2.6, x: -4, y: 0.25, collisionFlags: flag })
      this.third.physics.add.box({ mass: mass, height: 0.1, width: 2.4, x: -4, y: 0.35, collisionFlags: flag })
      this.third.physics.add.box({ mass: mass, height: 0.1, width: 2.2, x: -4, y: 0.45, collisionFlags: flag })
      this.third.physics.add.box({ mass: mass, height: 0.1, width: 2, x: -4, y: 0.55, collisionFlags: flag })
      this.third.physics.add.box({ mass: mass, height: 0.1, width: 1.8, x: -4, y: 0.65, collisionFlags: flag })
      this.third.physics.add.box({ mass: mass, height: 0.1, width: 1.6, x: -4, y: 0.75, collisionFlags: flag })
      this.third.physics.add.box({ mass: mass, height: 0.1, width: 1.4, x: -4, y: 0.85, collisionFlags: flag })

      this.third.physics.add.box({ height: 0.2, width: 3, x: 0.5, y: 0.1, collisionFlags: flag })
      this.third.physics.add.box({ height: 0.2, width: 2.6, x: 0.5, y: 0.3, collisionFlags: flag })
      this.third.physics.add.box({ height: 0.2, width: 2.2, x: 0.5, y: 0.5, collisionFlags: flag })
      this.third.physics.add.box({ height: 0.2, width: 1.8, x: 0.5, y: 0.7, collisionFlags: flag })
      this.third.physics.add.box({ height: 0.2, width: 1.4, x: 0.5, y: 0.9, collisionFlags: flag })
      this.third.physics.add.box({ height: 0.2, width: 1, x: 0.5, y: 1.1, collisionFlags: flag })

      this.third.physics.add.box({ height: 0.3, width: 3, x: 5, y: 0.15, collisionFlags: flag })
      this.third.physics.add.box({ height: 0.3, width: 2.1, x: 5, y: 0.45, collisionFlags: flag })
      this.third.physics.add.box({ height: 0.3, width: 1.2, x: 5, y: 0.75, collisionFlags: flag })
      this.third.physics.add.box({ height: 0.3, width: 0.3, x: 5, y: 1.05, collisionFlags: flag })
    }
  }

  update(time) {
    let walk = {
      x: 0,
      z: 0
    }

    if (this.keys.w.isDown) {
      walk.z = -0.07
    } else if (this.keys.s.isDown) {
      walk.z = 0.07
    }
    if (this.keys.a.isDown) {
      walk.x = -0.07
    } else if (this.keys.d.isDown) {
      walk.x = 0.07
    }

    const isMoving = Math.abs(walk.x) > 0 || Math.abs(walk.z) > 0

    this.player.controller.setWalkDirection(new Ammo.btVector3(walk.x, 0, walk.z))

    if (this.keys.space.isDown) {
      this.player.controller.jump()
    }

    const speed = this.platform.userData.speedX * Math.sin(time / 2000) * 8

    if (this.platform?.body) {
      this.platform.body.transform()
      const pos = this.platform.body.getPosition()
      this.platform.body.setPosition(pos.x + speed, pos.y, pos.z)
      this.platform.body.refresh()
    }

    const t = this.player.controller.getGhostObject().getWorldTransform()
    const p = t.getOrigin()
    const v = this.third.new.vector3(p.x(), p.y(), p.z())
    this.lookAt.lerp(v, 0.05)
    this.third.camera.lookAt(this.lookAt)

    // console.log(this.platform.userData.onPlatform)
    if (this.platform.userData.onPlatform) {
      const i = this.player.controller.getGhostObject().getNumOverlappingObjects()
      t.setOrigin(new Ammo.btVector3(p.x() + speed, p.y(), p.z()))
    }

    let btRayFrom = new Ammo.btVector3(p.x(), p.y(), p.z())
    let btRayTo = new Ammo.btVector3(p.x(), p.y() - 1, p.z())

    // rayCallback = new Ammo.ClosestRayResultCallback(btRayFrom, btRayTo)
    let rayCallback = new Ammo.ClosestRayResultCallback(new Ammo.btVector3(0, 0, 0), new Ammo.btVector3(0, 0, 0))
    rayCallback.set_m_rayFromWorld(btRayFrom)
    rayCallback.set_m_rayToWorld(btRayTo)

    this.third.physics.physicsWorld.rayTest(btRayFrom, btRayTo, rayCallback)

    this.player.controller.setGravity(9.8 * 3)

    // console.log(!isMoving, this.platform.userData.onPlatform, rayCallback.hasHit())
    if (!isMoving && this.platform.userData.onPlatform && rayCallback.hasHit()) {
      let dist = p.y() - rayCallback.get_m_hitPointWorld().y()
      this.player.controller.setGravity(0)
    }

    // const t = this.controller.getGhostObject().getWorldTransform()
    // const p = t.getOrigin()

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
    this.platform.userData.onPlatform = false
  }
}
