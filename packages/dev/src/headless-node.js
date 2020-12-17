const { Ammo, Physics, ServerClock, Loaders, ExtendedObject3D, ExtendedMesh } = require('@enable3d/ammo-on-nodejs')
const path = require('path')

const MainScene = () => {
  const physics = new Physics()

  let ground = physics.add.ground({ width: 20, height: 20, name: 'ground' })

  ground.body.on.collision((otherObject, event) => {
    console.log(`${ground.name} > ${event} > ${otherObject.name}`)
    if (event === 'start')
      setTimeout(() => {
        console.log(`destroy ${otherObject.name}`)
        physics.destroy(otherObject)
      }, 100)
  })

  const FBXLoader = new Loaders.FBXLoader()
  FBXLoader.load(path.resolve(__dirname, 'assets/Idle.fbx')).then(fbx => {
    const robot = new ExtendedObject3D()
    robot.name = 'robot'

    robot.add(fbx)
    robot.scale.set(0.05, 0.05, 0.05)
    robot.position.set(5, 12, 0)

    const physicsOptions = {
      addChildren: false,
      shape: 'hull' // or any other shape you want
    }

    physics.add.existing(robot, physicsOptions)
    this.robot = robot
  })

  const GLTFLoader = new Loaders.GLTFLoader()
  GLTFLoader.load(path.resolve(__dirname, 'assets/hero.glb')).then(gltf => {
    const child = gltf.scene.children[0]

    const hero = new ExtendedObject3D()
    hero.name = 'hero'

    hero.add(child)
    hero.position.set(-10, 12, 0)

    const physicsOptions = {
      addChildren: false,
      shape: 'hull' // or any other shape you want
    }

    physics.add.existing(hero, physicsOptions)

    this.hero = hero
  })

  // clock
  const clock = new ServerClock()

  // for debugging I disable high accuracy
  // high accuracy will use much more cpu power
  if (process.env.NODE_ENV !== 'production') clock.disableHighAccuracy()

  // loop
  const animate = delta => {
    physics.update(delta * 1000)

    if (this.hero?.body) {
      const pos = this.hero.position.y.toFixed(2)
      if (pos > 10) console.log(this.hero.name, pos)
    }

    if (this.robot?.body) {
      const pos = this.robot.position.y.toFixed(2)
      if (pos > 10) console.log(this.robot.name, pos)
    }
  }
  clock.onTick(delta => {
    animate(delta)
  })
}

Ammo().then(() => {
  MainScene()
})
