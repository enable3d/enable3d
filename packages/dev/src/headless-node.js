const { AmmoPhysics, Clock } = require('@enable3d/ammo-physics')
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
  const clock = new Clock()

  // -- NOTE --
  // In headless mode you have to call body.transform()
  // before and body.refresh() after getting or setting position or rotation.
  //
  // box.body.transform()
  // const pos = box.body.position
  // box.body.setPosition(pos.x, pos.y + 0.01, pos.z)
  // box.body.refresh()

  // loop
  const animate = () => {
    setTimeout(animate, 1000 / 60)
    physics.update(clock.getDelta() * 1000)

    // box.body.transform()
    // const pos = box.body.position
    // console.log(pos)
  }
  animate()
}

Ammo().then(() => {
  MainScene()
})
