import { Project, Scene3D, PhysicsLoader, FLAT } from 'enable3d'

import { Camera, LinearFilter, LinearMipMapLinearFilter, NearestFilter, Scene } from 'three'

class MainScene extends Scene3D {
  ui: {
    camera: Camera
    scene: Scene
  }

  matter = new FLAT.MatterPhysics()
  ball: FLAT.SimpleSprite

  async create() {
    this.warpSpeed()

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

      FLAT.render(this.ui.camera)
    }
  }
}

const startProject = () => {
  PhysicsLoader('/lib', () => new Project({ scenes: [MainScene] }))
}

export default startProject
