import {
  Project,
  Scene3D,
  PhysicsLoader,
  ExtendedObject3D,
  FirstPersonControls,
  ThirdPersonControls,
  THREE,
  Types,
  PointerDrag,
  PointerLock
} from 'enable3d'

const isTouchDevice = 'ontouchstart' in window

class MainScene extends Scene3D {
  async create() {
    const features = await this.warpSpeed()

    this.physics.debug?.enable()

    new PointerLock(this.canvas)

    const pd = new PointerDrag(this.canvas)
    pd.onMove(delta => console.log(delta))

    // custom shape (as child)
    let robot = new ExtendedObject3D()
    let sphere2 = this.make.sphere({ radius: 0.5 }) // relative position to box1
    robot.add(sphere2)
    robot.position.setY(2)
    this.add.existing(robot)
    this.physics.add.existing(robot, { shape: 'box' })

    // custom shape
    let sphere0 = this.add.sphere({ radius: 0.5 }) // relative position to box1
    sphere0.position.setY(2)
    this.physics.add.existing(sphere0, { shape: 'box', width: 0.75 })

    // compound shape (child based)
    // (the center of mass is the center of the box)
    let box1 = this.add.box({ x: -8, y: 2 })
    let sphere1 = this.add.sphere({ radius: 0.5, x: 0.25, y: 0.5 }) // relative position to box1
    box1.add(sphere1)
    this.physics.add.existing(box1)

    // compound shape (group)
    // (the center of mass is 0,0,0)
    let group = new THREE.Group()
    const body = this.add.box({ height: 0.8, y: 1, width: 0.4, depth: 0.4 }, { lambert: { color: 0xffff00 } })
    const head = this.add.sphere({ radius: 0.25, y: 1.7, z: 0.05 }, { lambert: { color: 0xffff00 } })
    group.add(body, head)
    group.position.setX(2)
    this.add.existing(group)
    // @ts-ignore
    this.physics.add.existing(group)

    // simple sphere
    let sphere = this.add.sphere({ x: 8 })
    this.physics.add.existing(sphere)

    // add hacd shape
    let torus = this.add.torus({ x: -4, y: 2 })
    this.physics.add.existing(torus, { shape: 'hacd' })

    this.physics.add.box({ y: 5, collisionFlags: 2 })

    // custom compound shape
    const box = this.add.box({ z: -5 })
    const compound: Types.CustomCompoundShape = [
      { shape: 'box', width: 0.5, height: 1, depth: 0.4, y: -0.5, z: 0.5 },
      { shape: 'box', width: 2.4, height: 0.6, depth: 0.4, z: -0.4, y: 0.2 },
      { shape: 'sphere', radius: 0.65, z: -0.25, y: 0.35 },
      { shape: 'box', width: 1.5, height: 0.8, depth: 1, y: 0.2, z: 0.2 }
    ]
    this.physics.add.existing(box, { compound })
  }
}
const startProject = () => {
  PhysicsLoader('/lib', () => new Project({ scenes: [MainScene] }))
}

export default startProject
