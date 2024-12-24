import { ExtendedMesh, ExtendedObject3D } from 'enable3d'
import MainScene from '../scenes/mainScene.js'

const addRobot = (scene: MainScene, ground: ExtendedMesh) => {
  let robot = new ExtendedObject3D()

  const pos = { x: 3, y: 2, z: -19 }

  scene.third.load.fbx('assets/Idle.fbx').then(object => {
    robot.add(object)

    scene.third.animationMixers.add(robot.animation.mixer)

    robot.anims.add('Idle', object.animations[0])
    robot.anims.play('Idle')
    robot.traverse(child => {
      // @ts-ignore
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    robot.name = 'robot'
    robot.scale.set(0.05, 0.05, 0.05)
    robot.position.set(pos.x, pos.y, pos.z)
    robot.rotation.set(0, -Math.PI / 2, 0)
    scene.third.add.existing(robot)
    scene.third.physics.add.existing(robot as any, { width: 3, depth: 3 })

    // not 100% sure how this works :/
    // robot.body.setAngularFactor(0, 1, 0)

    // sensor
    const sensor = scene.third.physics.add.box(
      {
        ...pos,
        x: pos.x - 8,
        y: pos.y,
        z: pos.z - 4,
        height: 5,
        name: 'ghost',
        collisionFlags: 4,
        mass: 0.0001
      },
      { standard: { transparent: true, opacity: 0.2 } }
    )

    // This does not work :/
    // sensor.body.ammo.setAngularLowerLimit(0, 0, 0)
    // sensor.body.ammo.setAngularUpperLimit(0, 0, 0)

    scene.third.physics.add.constraints.lock(robot.body, sensor.body)
    scene.third.physics.add.collider(sensor, ground, event => {
      if (event === 'end') robot.body.setAngularVelocityY(5)
      else robot.body.setAngularVelocityY(0)
    })

    // load more animations
    const animations = ['Walking']
    animations.forEach(key => {
      scene.third.load.fbx(`assets/${key}.fbx`).then((object: any) => {
        robot.anims.add('Walking', object.animations[0])
        robot.anims.play('Walking')
      })
    })
  })

  return robot
}

export { addRobot }
