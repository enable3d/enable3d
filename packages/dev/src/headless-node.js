const { AmmoPhysics, ServerClock } = require('@enable3d/ammo-physics')
const Ammo = require('@enable3d/ammo-physics/ammo/ammo.js')

const MainScene = () => {
  console.log('headless')

  const physics = new AmmoPhysics('headless')

  let box = physics.add.box({ y: 10 })
  // console.log(box)

  let ground = physics.add.ground({ width: 20, height: 20 })

  ground.body.on.collision((otherObject, event) => {
    // console.log(otherObject.name, event)
  })

  // clock
  const clock = new ServerClock()

  // for debugging I disable high accuracy
  clock.disableHighAccuracy()

  // loop
  const animate = delta => {
    physics.update(delta * 1000)

    // box.body.transform()
    // const pos = box.body.position
    // console.log(pos)
  }
  clock.onTick(delta => {
    animate(delta)
  })
}

Ammo().then(() => {
  MainScene()
})
