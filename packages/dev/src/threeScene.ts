import { Project, Scene3D, PhysicsLoader, ExtendedObject3D, THREE } from 'enable3d'
import { Vehicle } from '@enable3d/ammo-physics/dist/vehicle'
import { DirectionalLight } from '../../common/node_modules/@enable3d/three-wrapper/dist'
import { chdir } from 'process'

const isTouchDevice = 'ontouchstart' in window

class MainScene extends Scene3D {
  car: Vehicle
  keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false
  }
  vehicleSteering = 0
  light: DirectionalLight

  async create() {
    //this.physics.debug?.enable()

    const { lights } = await this.warpSpeed('-ground')

    if (lights) {
      this.light = lights.directionalLight
      const d = 4
      this.light.shadow.camera.top = d
      this.light.shadow.camera.bottom = -d
      this.light.shadow.camera.left = -d
      this.light.shadow.camera.right = d

      this.light.shadow.mapSize.set(2048, 2048)

      this.light.shadow.camera.near = 200
      this.light.shadow.camera.far = 240

      // https://stackoverflow.com/a/48939256
      this.light.shadow.bias = -0.01

      // debug shadow
      const shadowHelper = new THREE.CameraHelper(this.light.shadow.camera)
      this.scene.add(shadowHelper)
    }

    this.camera.position.set(5, 10, -20)
    this.camera.lookAt(0, 0, 0)
    // this.physics.debug?.enable()

    this.load.texture('/assets/grass.jpg').then(grass => {
      const grassGround = grass.clone()
      grassGround.needsUpdate = true
      grassGround.wrapS = grassGround.wrapT = 1000 // RepeatWrapping
      grassGround.offset.set(0, 0)
      grassGround.repeat.set(10, 10)

      this.physics.add.ground({ y: -1, width: 100, height: 100 }, { lambert: { map: grassGround } })

      const ramp = this.add.box({ width: 5, height: 10, z: -20 }, { lambert: { map: grass } })
      ramp.rotateX(-Math.PI / 3)
      this.physics.add.existing(ramp, { collisionFlags: 1, mass: 0 })
    })

    const gltf = await this.load.gltf('/assets/car.glb')
    const scene = gltf.scenes[0]

    let chassis: ExtendedObject3D
    let tire: ExtendedObject3D

    scene.traverse(child => {
      // @ts-ignore
      if (child.isMesh) {
        if (/window/gi.test(child.name)) {
          // @ts-ignore
          child.material.transparent = true
          // @ts-ignore
          child.material.opacity = 0.5
        } else if (child.name === 'Chassis') {
          chassis = child as ExtendedObject3D
          chassis.receiveShadow = chassis.castShadow = true
        } else if (child.name === 'Tire') {
          tire = child as ExtendedObject3D
          tire.receiveShadow = tire.castShadow = true
          tire.geometry.center()
        }
      }
    })
    // this.add.existing(gltf.scenes[0])

    if (!chassis || !tire) return

    this.add.existing(chassis)
    this.physics.add.existing(chassis, { shape: 'convex', mass: 1200 })

    // const chassis = this.physics.add.box(
    //   { depth: 3, height: 0.8, width: 1.75, mass: 1200 },
    //   { lambert: { color: 'red' } }
    // )
    chassis.add(this.camera)

    // const wheelMesh = this.make.cylinder(
    //   {
    //     radiusBottom: 0.4,
    //     radiusTop: 0.4,
    //     height: 0.2,
    //     radiusSegments: 12
    //   },
    //   { lambert: { color: 'black' } }
    // )

    this.car = new Vehicle(this.scene, this.physics, chassis, tire)

    // keys
    const keyEvent = (e: KeyboardEvent, down: boolean) => {
      switch (e.code) {
        case 'KeyW':
          this.keys.w = down
          break
        case 'KeyA':
          this.keys.a = down
          break
        case 'KeyS':
          this.keys.s = down
          break
        case 'KeyD':
          this.keys.d = down
          break
        case 'Space':
          this.keys.space = down
          break
      }
    }
    document.addEventListener('keydown', e => keyEvent(e, true))
    document.addEventListener('keyup', e => keyEvent(e, false))
  }

  update() {
    // adjust shadow
    this.light.position.x = this.car.chassis.position.x
    this.light.position.y = this.car.chassis.position.y + 200
    this.light.position.z = this.car.chassis.position.z + 100
    this.light.target = this.car.chassis

    const FRONT_LEFT = 0
    const FRONT_RIGHT = 1
    const BACK_LEFT = 2
    const BACK_RIGHT = 3

    let engineForce = 0
    let breakingForce = 0
    const steeringIncrement = 0.04
    const steeringClamp = 0.3
    const maxEngineForce = 5000
    const maxBreakingForce = 100

    const speed = this.car.vehicle.getCurrentSpeedKmHour()

    this.camera.lookAt(this.car.chassis.position.clone())

    // front/back
    if (this.keys.w) engineForce = maxEngineForce
    else if (this.keys.s) engineForce = -maxEngineForce
    else engineForce = 0

    // left/right
    if (this.keys.a) {
      if (this.vehicleSteering < steeringClamp) this.vehicleSteering += steeringIncrement
    } else if (this.keys.d) {
      if (this.vehicleSteering > -steeringClamp) this.vehicleSteering -= steeringIncrement
    } else {
      if (this.vehicleSteering > 0) this.vehicleSteering -= steeringIncrement / 2
      if (this.vehicleSteering < 0) this.vehicleSteering += steeringIncrement / 2
      if (Math.abs(this.vehicleSteering) <= steeringIncrement) this.vehicleSteering = 0
    }

    // break
    if (this.keys.space) breakingForce = maxBreakingForce
    else breakingForce = 0

    this.car.vehicle.applyEngineForce(engineForce, BACK_LEFT)
    this.car.vehicle.applyEngineForce(engineForce, BACK_RIGHT)

    this.car.vehicle.setSteeringValue(this.vehicleSteering, FRONT_LEFT)
    this.car.vehicle.setSteeringValue(this.vehicleSteering, FRONT_RIGHT)

    this.car.vehicle.setBrake(breakingForce / 2, FRONT_LEFT)
    this.car.vehicle.setBrake(breakingForce / 2, FRONT_RIGHT)
    this.car.vehicle.setBrake(breakingForce, BACK_LEFT)
    this.car.vehicle.setBrake(breakingForce, BACK_RIGHT)

    this.car.update()
  }
}

const startProject = () => {
  PhysicsLoader('/lib', () => new Project({ scenes: [MainScene] }))
}

export default startProject
