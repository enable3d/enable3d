// import { THREE } from '@enable3d/phaser-extension'
import { AmmoPhysics, Clock, PhysicsLoader } from '@enable3d/ammo-physics'

const MainScene = () => {
  const physics = new AmmoPhysics('headless')

  const box = physics.add.box({ y: 10 })

  const ground = physics.add.ground({ width: 20, height: 20 })

  ground.body.on.collision((otherObject: any, event: string) => {
    console.log(otherObject.name, event)
  })

  // clock
  const clock = new Clock()

  // loop
  const animate = () => {
    physics.update(clock.getDelta() * 1000)
    box.body.transform()

    if (box.body.position.y > 2) {
      console.log(box.body.position.y)
      requestAnimationFrame(animate)
    } else {
      console.log('Done!')
    }
  }
  requestAnimationFrame(animate)
}

const startHeadless = () => {
  PhysicsLoader('/lib', () => MainScene())
}

export default startHeadless
