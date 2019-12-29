import MainScene from '../scenes/mainScene'

const Robot = (scene: MainScene) => {
  const robot = scene.third.new.extendedObject3D()
  const pos = { x: 3, y: 2, z: -19 }

  scene.third.load.fbx('assets/Idle.fbx', (object: any) => {
    robot.add(object)

    robot.mixer = scene.third.new.animationMixer(robot)

    robot.anims['Idle'] = object.animations[0]
    robot.action = robot.mixer.clipAction(object.animations[0])
    robot.action.play()
    robot.traverse(child => {
      // @ts-ignore
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    robot.scale.set(0.05, 0.05, 0.05)
    robot.position.set(pos.x, pos.y, pos.z)
    robot.rotation.set(0, -Math.PI / 2, 0)
    scene.third.add.existing(robot)
    scene.third.physics.add.existing(robot)

    // not 100% sure how this works :/
    // robot.body.setAngularFactor(0, 1, 0)

    // sensor
    let sensor = scene.third.physics.add.box({
      ...pos,
      x: pos.x - 8,
      y: pos.y - 2,
      z: pos.z - 4,
      collisionFlag: 4,
      mass: 0.0001
    })

    // This does not work :/
    // sensor.body.ammoBody.setAngularLowerLimit(0, 0, 0)
    // sensor.body.ammoBody.setAngularUpperLimit(0, 0, 0)

    scene.third.physics.add.constraints.lock(robot.body, sensor.body)
    scene.third.physics.add.collider(sensor, scene.third.ground, event => {
      if (event === 'end') robot.body.setAngularVelocityY(5)
      else robot.body.setAngularVelocityY(0)
    })

    // load more animations
    const animations = ['Walking']
    animations.forEach(key => {
      scene.third.load.fbx(`assets/${key}.fbx`, (object: any) => {
        robot.anims[key] = object.animations[0]
        robot.setAction('Walking')
      })
    })
  })

  return robot
}

export default Robot
