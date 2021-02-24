import { Scene3D, ExtendedObject3D, THREE } from '@enable3d/phaser-extension'
import { ClosestRaycaster, AllHitsRaycaster } from '@enable3d/ammo-physics'

export default class MainScene extends Scene3D {
  constructor() {
    super({ key: 'MainScene' })
  }

  init() {
    this.accessThirdDimension({ enableXR: false, antialias: false })
  }

  create() {
    this.third.warpSpeed('-orbitControls')

    let rect = this.add.rectangle(50, 50, 50, 50, 0xff00ff)
    rect.setInteractive()
    rect.on('pointerdown', () => {
      console.log('click')
    })

    let box = this.third.physics.add.box({ y: 10 })

    // raycaster
    const onMouseMove = (event: MouseEvent) => {
      // calculate mouse position in normalized device coordinates
      // (-1 to +1) for both components

      let raycaster = new THREE.Raycaster()
      let mouse = new THREE.Vector2()

      mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

      raycaster.setFromCamera(mouse, this.third.camera)

      let intersects = raycaster.intersectObjects(this.third.scene.children)

      console.log('intersects.length', intersects.length)

      for (let i = 0; i < intersects.length; i++) {
        // console.log('raycast', intersects[i].object)
        // @ts-ignore
        intersects[i].object?.material?.color?.set(0xff0000)
      }
    }

    window.addEventListener('pointerdown', onMouseMove)

    // remove the event once phaser restarts
    this.events.on('shutdown', () => {
      window.removeEventListener('pointerdown', onMouseMove)
    })

    setTimeout(() => {
      this.scene.restart()
    }, 5000)
  }

  update() {}
}
