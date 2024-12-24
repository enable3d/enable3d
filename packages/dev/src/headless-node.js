import Module from 'node:module'
import path from 'path'
import { Physics, ServerClock, Loaders, ExtendedObject3D } from '../../ammoOnNodejs/dist/index.js'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const require = Module.createRequire(import.meta.url)

var _ammo = require(path.resolve(__dirname, '../../ammoOnNodejs/ammo/ammo.cjs'))

const MainScene = () => {
  const physics = new Physics()

  // test
  const btVector3 = new Ammo.btVector3()
  console.log('btVector3', btVector3)

  let ground = physics.add.ground({ width: 20, height: 20, name: 'ground' })

  ground.body.on.collision((otherObject, event) => {
    console.log(`${ground.name} > ${event} > ${otherObject.name}`)
    if (event === 'start')
      setTimeout(() => {
        console.log(`destroy ${otherObject.name}`)
        physics.destroy(otherObject)
      }, 100)
  })

  let hero, robot

  const FBXLoader = new Loaders.FBXLoader()
  FBXLoader.load(path.resolve(__dirname, '../public/assets/Idle.fbx')).then(fbx => {
    robot = new ExtendedObject3D()
    robot.name = 'robot'

    robot.add(fbx)
    robot.scale.set(0.05, 0.05, 0.05)
    robot.position.set(5, 12, 0)

    const physicsOptions = {
      addChildren: false,
      shape: 'hull' // or any other shape you want
    }

    physics.add.existing(robot, physicsOptions)
  })

  const GLTFLoader = new Loaders.GLTFLoader()
  GLTFLoader.load(path.resolve(__dirname, '../public/assets/hero.glb')).then(gltf => {
    const child = gltf.scene.children[0]

    hero = new ExtendedObject3D()
    hero.name = 'hero'

    hero.add(child)
    hero.position.set(-10, 12, 0)

    const physicsOptions = {
      addChildren: false,
      shape: 'hull' // or any other shape you want
    }

    physics.add.existing(hero, physicsOptions)

    hero = hero
  })

  // clock
  const clock = new ServerClock()

  // for debugging I disable high accuracy
  // high accuracy will use much more cpu power
  if (process.env.NODE_ENV !== 'production') clock.disableHighAccuracy()

  // loop
  const animate = delta => {
    physics.update(delta * 1000)

    if (hero && hero.body) {
      const pos = hero.position.y.toFixed(2)
      if (pos > 10) console.log(hero.name, pos)
    }

    if (robot && robot.body) {
      const pos = robot.position.y.toFixed(2)
      if (pos > 10) console.log(robot.name, pos)
    }
  }
  clock.onTick(delta => {
    animate(delta)
  })
}

_ammo().then(Ammo => {
  globalThis.Ammo = Ammo

  // test
  const btVector3 = new Ammo.btVector3()
  console.log('btVector3', btVector3)

  MainScene()
})
