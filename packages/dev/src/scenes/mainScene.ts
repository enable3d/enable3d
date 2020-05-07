import { Scene3D, Object3D, ExtendedObject3D, THREE } from '@enable3d/phaser-extension'
import { ClosestRaycaster, AllHitsRaycaster } from '@enable3d/ammo-physics'

export default class MainScene extends Scene3D {
  constructor() {
    super({ key: 'MainScene' })
  }

  init() {
    this.requestThirdDimension()
  }

  create() {
    this.accessThirdDimension()
    this.third.warpSpeed('-ground')

    this.third.physics.add.ground({ y: -1, width: 4, height: 4, name: 'groundOne' })
    this.third.physics.add.ground({ y: -3, width: 4, height: 4, name: 'groundTwo' })
    this.third.physics.add.ground({ y: -5, width: 4, height: 4, name: 'groundThree' })

    const closest = () => {
      const raycaster = this.third.physics.add.raycaster('closest') as ClosestRaycaster // 'closest' is the default

      raycaster.setRayFromWorld(1, 5, 2)
      raycaster.setRayToWorld(2, -10, 0)
      raycaster.rayTest()

      if (raycaster.hasHit()) {
        const { x, y, z } = raycaster.getHitPointWorld()
        const { name } = raycaster.getCollisionObject()
        console.log('closest', name, x, y, z)
      }

      // destroy the raycaster if you do not use it anymore
      // (but you can of course reuse it multiple times)
      raycaster.destroy()
    }

    const allHits = () => {
      const raycaster = this.third.physics.add.raycaster('allHits') as AllHitsRaycaster

      raycaster.setRayFromWorld(1, 5, 2)
      raycaster.setRayToWorld(2, -10, 0)
      raycaster.rayTest()

      if (raycaster.hasHit()) {
        raycaster.getCollisionObjects().forEach((obj, i) => {
          const { x, y, z } = raycaster.getHitPointWorld()[i]
          const { name } = obj
          console.log('allHits: ', name, x, y, z)
        })
      }

      // destroy the raycaster if you do not use it anymore
      // (but you can of course reuse it multiple times)
      raycaster.destroy()
    }

    closest()
    console.log('-- DONE --')
    allHits()
    console.log('-- DONE --')
  }

  update() {}
}
