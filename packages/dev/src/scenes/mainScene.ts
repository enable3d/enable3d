/**
 * This article helped a lot!
 * https://medium.com/@bluemagnificent/intro-to-javascript-3d-physics-using-ammo-js-and-three-js-dd48df81f591
 */

import { Object3D, Scene3D, ExtendedObject3D } from 'enable3d'
import Robot from '../objects/robot'

export default class MainScene extends Scene3D {
  sphere: Object3D
  hero: ExtendedObject3D
  robot: ExtendedObject3D
  keys: any
  gameOver: boolean
  playerCanJump = false
  constructor() {
    super({ key: 'MainScene' })
  }

  init() {
    this.requestThirdDimension()
    delete this.hero
    delete this.robot
    this.gameOver = false
  }

  create() {
    // TODO enable to use negative string e.g. '-ground' remove ground from the features
    this.accessThirdDimension()
    this.third.warpSpeed()
    // camera fadeIn effect
    this.cameras.main.fadeIn(2000, 255, 250, 250)
    // this.third.haveSomeFun()

    // enable physics debugging
    this.third.physics.debug.enable()
    this.third.physics.debug.mode(3) // 1, 2 or 3

    // this.third.warpedStart({ quickStart: true, orbitControls: true })

    // test extrude
    const shape = this.third.new.shape()
    shape.arc(0, 0, 4, 0, Math.PI, false)
    shape.arc(4, 0, 3, Math.PI, 2 * Math.PI, true)
    const curve1 = this.third.add.extrude({ y: 2, shape, curveSegments: 10, depth: 1, bevelEnabled: false })
    const curve2 = this.third.physics.add.extrude({ y: 10, shape, curveSegments: 10, depth: 1, bevelEnabled: false })

    // start Phaser3D
    // this.third = new ThirdDimension(this, { quickStart: true, orbitControls: true })

    // test CSG (Constructive Solid Geometry) with physics
    const box = this.third.make.box({ x: 0.75, y: 2.75, z: -0.25 })
    const sphere = this.third.make.sphere({ radius: 0.5, x: 1, y: 3 })

    const int = this.third.mesh.intersect(box, sphere) as ExtendedObject3D
    const sub = this.third.mesh.subtract(box, sphere) as ExtendedObject3D
    const uni = this.third.mesh.union(box, sphere) as ExtendedObject3D
    int.name = 'int'
    sub.name = 'sub'
    uni.name = 'uni'

    const mat = this.third.new.defaultMaterial()

    const geometries = [int, sub, uni]
    geometries.forEach((geo, i) => {
      geo.position.setX((i - 1) * 2)
      geo.position.setY(5)
      geo.rotateX(10)
      geo.material = mat
      geo.castShadow = geo.receiveShadow = true
      // Can be 'convex' or 'concave' (concave shapes are always static)
      geo.shape = 'convex'
      this.third.physics.add.existing(geo)
    })

    this.robot = Robot(this)

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
      // this.third.mixers.push(mixer)

      // create hero object3D
      // this.hero = this.third.new.object3D()
      this.hero.position.set(-5, 15, 1)
      this.third.scene.add(this.hero)
      this.hero.scale.setX(0.1)
      this.hero.scale.setY(0.1)
      this.hero.scale.setZ(0.1)
      this.third.physics.add.existing(this.hero)
      this.third.physics.add.existing(this.hero)
      // only turn on the y axis
      // @ts-ignore
      this.hero.body.setAngularFactor(0, 1, 0)
      this.hero.body.on.collision(obj => {
        if (obj.name !== 'ground') {
          // console.log('the hero collides with another object than the ground')
        }
      })

      // Add 3rd Person controls
      this.third.controls.add.thirdPerson(this.hero, {
        offset: this.third.new.vector3(0, 3, 0)
      })
    })

    // make the sphere
    let S = this.third.make.sphere({ radius: 2, x: -10, z: -10, y: 15 }, { standard: { color: 0xff00ff } })
    // add the sphere to the scene
    this.third.add.existing(S)
    // add physics to the sphere
    this.third.physics.add.existing(S)

    this.third.physics.add.sphere({ radius: 2, x: 10, z: -10, y: 15 }, { standard: { color: 0xff00ff } })

    // collider between 2 objects
    // it only works once the hero and robots are loaded
    // this is why I simply added a delay to test it
    this.time.addEvent({
      delay: 2000,
      callback: () => {
        this.third.physics.add.collider(this.hero, this.robot, () => {
          this.robot.body.applyForceY(1)
          console.log('hero is colliding with robot')
        })
      }
    })

    // ground without physics
    // this.third.add.ground({ width: 25, height: 10, depth: 1, y: 5 }, { standard: { color: 0xff00ff } })
    this.third.on.collision(data => {
      const { event, bodies } = data
      if (bodies[0].name === 'ground' || bodies[1].name === 'ground') {
        if (bodies[0].name === 'hero' || bodies[1].name === 'hero') {
          // the player is on the ground and can jump
          if (!this.playerCanJump && event !== 'end') this.playerCanJump = true
          if (event === 'start') console.log('Hero "starts" colliding with ground')
          if (event === 'end') console.log('Hero "ended" colliding with ground')
        }
      }
    })

    // constraint test (spring)
    let box1 = this.third.physics.add.box({ x: 10, z: 16, y: 20 }, { standard: { color: 0xff00ff } })
    let box2 = this.third.physics.add.box(
      { x: 10, z: 17, y: 15, collisionFlag: 4, mass: 5 },
      { standard: { color: 0xffff00 } }
    )
    this.third.physics.add.constraints.spring(box1.body, box2.body, { angularLock: false })

    this.third.physics.add.collider(this.third.ground, box2, event => {
      // console.log('YELLOW_BLOCK overlaps GROUND', event)
    })

    box1.body.on.collision((otherObject, event) => {
      // if (otherObject.name === 'ground') console.log('The green ball collides with the ground')
      // else console.log('The green ball collides with another ball')
    })

    // 3 spheres with physics
    this.third.physics.add
      .sphere({ y: 20, z: 0 }, { phong: { color: 0x00ff00, shininess: 100, specular: 0xff0000 } })
      .body.setRestitution(0.8)
    this.third.physics.add.sphere({ x: 0.25, y: 25, z: 0.25 }).body.setRestitution(0.8)
    this.third.physics.add.sphere({ x: 0.25, y: 30, z: -0.25 }).body.setRestitution(0.8)

    this.keys = {
      a: this.input.keyboard.addKey('a'),
      w: this.input.keyboard.addKey('w'),
      d: this.input.keyboard.addKey('d'),
      s: this.input.keyboard.addKey('s'),
      space: this.input.keyboard.addKey(32)
    }

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
  }

  update(time, delta) {
    if (this.robot?.body) {
      const speed = 7
      const rotation = this.robot.getWorldDirection(this.robot.rotation.toVector3())
      const theta = Math.atan2(rotation.x, rotation.z)

      const x = Math.sin(theta) * speed,
        y = this.robot.body.velocity.y,
        z = Math.cos(theta) * speed

      this.robot.body.setVelocity(x, y, z)
    }

    if (this.hero && this.hero.body) {
      // Example on how the camera could follow the player
      const cameraFollowsPlayer = false
      if (cameraFollowsPlayer) {
        let pos = this.hero.position
        this.third.camera.lookAt(pos.x, pos.y + 2, pos.z)
        this.third.camera.position.copy(pos)
        this.third.camera.position.z -= 12
        this.third.camera.position.y += 6
      }

      if (this.gameOver) {
        // camera shake effect
        this.third.camera.position.x += Math.random() - 0.5
        this.third.camera.position.y += Math.random() - 0.5
        this.third.camera.position.z += Math.random() - 0.5
      }

      if (!this.gameOver && this.hero.position.y < -10) {
        this.gameOver = true
        this.time.addEvent({ delay: 1000, callback: () => this.scene.restart() })
      }

      if (this.keys.space.isDown && this.playerCanJump) {
        this.playerCanJump = false
        console.log('jump')
        this.hero.body.applyForceY(6)
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

      if (this.keys.a.isDown) this.hero.body.setAngularVelocityY(3)
      else if (this.keys.d.isDown) this.hero.body.setAngularVelocityY(-3)
      else this.hero.body.setAngularVelocityY(0)
    }
  }
}
