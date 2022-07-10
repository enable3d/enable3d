import { Keyboard } from '@yandeu/keyboard'
import {
  ExtendedObject3D,
  FirstPersonControls,
  FLAT,
  PhysicsLoader,
  PointerDrag,
  PointerLock,
  Project,
  Scene3D,
  ThirdPersonControls,
  THREE
} from 'enable3d'
import { REVISION } from 'three'
import { FlatArea } from '../../threeGraphics/jsm/flat'

const isTouchDevice = 'ontouchstart' in window

class MainScene extends Scene3D {
  ui!: FlatArea
  player!: ExtendedObject3D
  controls!: FirstPersonControls
  move = { right: 0, top: 0 }
  keyboard = new Keyboard()
  can = { jump: true }
  secondCamera!: THREE.PerspectiveCamera
  glock!: ExtendedObject3D

  preRender() {
    // FLAT.preRender(this.renderer)
  }

  postRender() {
    // FLAT.postRender(this.renderer, this.ui)
    this.renderer.clear()

    // first camera
    this.renderer.setSize(1280, 720)

    this.renderer.setViewport(0, 0, 1280, 720)
    // this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight)
    this.renderer.render(this.scene, this.camera)

    // clear
    this.renderer.clearDepth()

    // second camera
    const x = 450,
      y = 300
    // this.renderer.setScissorTest(true)
    // this.renderer.setScissor(50, 50, x, y)
    // this.renderer.setViewport(50, 50, x, y)
    this.renderer.render(this.scene, this.secondCamera)
    // this.renderer.setScissorTest(false)
  }

  update() {
    this.controls.update(this.move.right * 3, -this.move.top * 3)
    this.move.right = this.move.top = 0

    const speed = 8
    const v3 = new THREE.Vector3()

    const rotation = this.camera.getWorldDirection(v3)
    const theta = Math.atan2(rotation.x, rotation.z)

    {
      const x = Math.sin(theta) * speed,
        y = this.player.body.velocity.y,
        z = Math.cos(theta) * speed

      if (this.keyboard.key('KeyW').isDown) {
        this.player.body.setVelocity(x, y, z)
      } else if (this.keyboard.key('KeyS').isDown) {
        this.player.body.setVelocity(-x, -y, -z)
      }
    }

    if (this.keyboard.key('KeyA').isDown) {
      const x = Math.sin(theta + Math.PI / 2) * speed,
        y = this.player.body.velocity.y,
        z = Math.cos(theta + Math.PI / 2) * speed

      this.player.body.setVelocity(x, y, z)
    } else if (this.keyboard.key('KeyD').isDown) {
      const x = Math.sin(theta - Math.PI / 2) * speed,
        y = this.player.body.velocity.y,
        z = Math.cos(theta - Math.PI / 2) * speed

      this.player.body.setVelocity(x, y, z)
    }

    if (this.keyboard.key('Space').isDown && this.can.jump) {
      this.can.jump = false
      this.player.body.applyForceY(5)
      setTimeout(() => {
        this.can.jump = true
      }, 1000)
    }

    if (this.glock) {
      // https://stackoverflow.com/questions/17218054/how-to-put-an-object-in-front-of-camera-in-three-js
      var dist = 1
      var cwd = new THREE.Vector3()

      this.camera.getWorldDirection(cwd)

      cwd.multiplyScalar(dist)
      cwd.add(this.camera.position)

      this.glock.position.set(cwd.x, cwd.y, cwd.z)
      this.glock.setRotationFromQuaternion(this.camera.quaternion)
      this.glock.translateX(0.5)
      this.glock.translateY(-0.5)
      this.glock.translateZ(-0.8)
    }
  }

  async create() {
    await this.warpSpeed('-orbitControls', '-ground', '-sky', '-camera')

    this.camera = this.cameras.perspectiveCamera({ y: 0, z: 0, aspect: 1280 / 720 })
    this.camera?.layers.enable(1)

    this.secondCamera = this.cameras.perspectiveCamera({ y: 0, z: 0, aspect: 1280 / 720, fov: 25 })
    this.secondCamera.layers.enable(2)

    this.renderer.setClearColor(0xffffff, 0)
    this.renderer.autoClear = false

    // const light = this.lights.hemisphereLight()

    // this.secondCamera.add(light)
    this.camera.add(this.secondCamera)
    this.scene.background = new THREE.Color(0xffffff00)
    this.scene.background = null

    this.ui = FLAT.init(this.renderer)

    const size = new THREE.Vector2()
    this.renderer.getSize(size)
    console.log(size)

    const texture = new FLAT.TextTexture('test')
    const text = new FLAT.TextSprite(texture)
    text.setPosition(size.x / 2, size.y - text.textureHeight)
    this.ui.scene.add(text)

    // this.physics.debug?.enable()

    this.player = this.add.box(
      { x: -7, y: 5, height: 1, width: 0.4, depth: 0.4 },
      { phong: { color: 'green', transparent: true, opacity: 0.8 } }
    )
    this.player.layers.set(2)
    this.physics.add.existing(this.player, {
      shape: 'capsule',
      radius: 0.2,
      height: 0.6,
      offset: { y: 0 }
    })
    // this.player.body.setFriction(1)
    this.player.body.setAngularFactor(0, 0, 0)

    this.controls = new FirstPersonControls(this.camera, this.player, { offset: new THREE.Vector3(0, 1, 0) })

    // this.controls = new ThirdPersonControls(this.camera, this.player, {
    //   offset: new THREE.Vector3(0, 1, 0),
    //   targetRadius: 3
    // })

    const pointerLock = new PointerLock(this.canvas)
    const pointerDrag = new PointerDrag(this.canvas)
    pointerDrag.onMove(delta => {
      if (!pointerLock.isLocked()) return
      const { x, y } = delta
      this.move.top = -y
      this.move.right = x
    })

    this.load.gltf('/assets/glock.glb').then(gltf => {
      this.glock = gltf.scene as unknown as ExtendedObject3D
      // this.glock.position.set(0, 0, 2)
      // group.scale.set(2, 2, 2)
      // console.log(gltf)
      this.glock.layers.set(2)
      this.glock.children.forEach(child => {
        child.layers.set(2)
        child.children.forEach(child => {
          child.layers.set(2)
        })
      })

      console.log(this.glock)

      this.scene.add(this.glock)
      // this.secondCamera.add(group)
      // this.physics.add.existing(<any>group, { shape: 'concave', mass: 0, collisionFlags: 1 })
    })

    this.load.gltf('/assets/city.glb').then(gltf => {
      const group = gltf.scene as unknown as ExtendedObject3D
      group.scale.set(2, 2, 2)
      console.log(gltf)
      group.layers.set(1)
      group.children.forEach(child => {
        child.layers.set(1)
        child.children.forEach(child => {
          child.layers.set(1)
        })
      })

      this.add.existing(group)
      this.physics.add.existing(<any>group, { shape: 'concave', mass: 0, collisionFlags: 1 })
    })
  }
}

const startProject = () => {
  PhysicsLoader(
    '/lib',
    () => new Project({ scenes: [MainScene], antialias: true, alpha: true, gravity: { x: 0, y: -9.8 * 2, z: 0 } })
  )
}

export default startProject
