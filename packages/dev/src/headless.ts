// import { THREE } from '@enable3d/phaser-extension'
import { AmmoPhysics, PhysicsLoader, Clock } from '@enable3d/phaser-extension/node_modules/@enable3d/ammo-physics'

const MainScene = () => {
  const physics = new AmmoPhysics('headless')

  let box = physics.add.box({ y: 10 })

  let ground = physics.add.ground({ width: 20, height: 20 })

  ground.body.on.collision((otherObject: any, event: string) => {
    // console.log(otherObject.name, event)
  })

  // clock
  const clock = new Clock()

  // loop
  const animate = () => {
    physics.update(clock.getDelta() * 1000)
    box.body.transform()
    // console.log(box.body.position.y)

    requestAnimationFrame(animate)
  }
  requestAnimationFrame(animate)
}

const startHeadless = () => {
  PhysicsLoader('/lib', () => MainScene())
}

export default startHeadless
