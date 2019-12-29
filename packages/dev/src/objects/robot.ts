import MainScene from '../scenes/mainScene'

const Robot = (scene: MainScene) => {
  const robot = scene.third.new.extendedObject3D()
  const pos = { x: 3, y: 2, z: -15 }

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
    robot.rotateY(Math.PI * 0.5)
    scene.third.scene.add(robot)
    // scene.third.scene.add(robot)
    scene.third.physics.add.existing(robot)

    // sensor
    // @ts-ignore
    robot.goRight = true
    let sensor = scene.third.physics.add.box({ ...pos, x: pos.x + 3, y: pos.y - 2, collisionFlag: 4, mass: 0.001 })
    scene.third.physics.constraintTest(robot, sensor)

    // load more animations
    const animations = ['Walking']
    animations.forEach(key => {
      scene.third.load.fbx(`assets/${key}.fbx`, (object: any) => {
        robot.anims[key] = object.animations[0]
      })
    })
  })

  scene.time.addEvent({
    delay: 2500,
    loop: true,
    callback: () => {
      robot.setAction('Walking')
    }
  })

  scene.time.addEvent({
    delay: 5000,
    loop: true,
    callback: () => {
      robot.setAction('Idle')
    }
  })

  return robot
}

export default Robot
