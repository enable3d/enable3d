import { FLAT, PhysicsLoader, Project, Scene3D } from 'enable3d'

import { Camera, Scene } from 'three'

class MainScene extends Scene3D {
  ui: {
    camera: Camera
    scene: Scene
  }

  matter = new FLAT.physics()
  ball: FLAT.SimpleSprite

  async create() {
    const { orbitControls } = await this.warpSpeed()

    FLAT.initEvents({ orbitControls, canvas: this.renderer.domElement })

    this.renderer.autoClear = false // To allow render overlay on top of the 3d camera
    const width = window.innerWidth
    const height = window.innerHeight
    this.ui = {
      // {x: 0, y: 0} is bottomLeft
      camera: this.cameras.orthographicCamera({ left: 0, right: width, bottom: 0, top: height }),
      scene: new Scene()
    }
  }

  preRender() {
    this.renderer.clear()
  }

  postRender() {
    if (this.ui && this.ui.scene && this.ui.camera) {
      this.renderer.clearDepth()
      this.renderer.render(this.ui.scene, this.ui.camera)

      FLAT.updateEvents(this.ui.camera)
    }
  }
}

const startProject = () => {
  PhysicsLoader('/lib', () => new Project({ scenes: [MainScene] }))
}

export default startProject
