import { ExtendedObject3D, Scene3D, THREE } from '@enable3d/phaser-extension'
import { AllHitsRaycaster, ClosestRaycaster } from '@enable3d/ammo-physics'
import { TextureLoader } from '../../../common/node_modules/@enable3d/three-wrapper/dist'

export default class MainScene extends Scene3D {
  constructor() {
    super({ key: 'MainScene' })
  }

  init() {
    this.accessThirdDimension({ enableXR: false, antialias: false })
  }

  create() {
    this.third.warpSpeed('-orbitControls')

    const rect = this.add.rectangle(50, 50, 50, 50, 0xff00ff)
    rect.setInteractive()
    rect.on('pointerdown', () => {
      console.log('click')
    })

    const box = this.third.physics.add.box({ y: 10 })

    // raycaster
    const onMouseMove = (event: MouseEvent) => {
      // calculate mouse position in normalized device coordinates
      // (-1 to +1) for both components

      const raycaster = new THREE.Raycaster()
      const mouse = new THREE.Vector2()

      mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

      raycaster.setFromCamera(mouse, this.third.camera)

      const intersects = raycaster.intersectObjects(this.third.scene.children)

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
