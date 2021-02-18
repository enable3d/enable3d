import { Project, Scene3D, PhysicsLoader, ExtendedMesh, FLAT, THREE } from 'enable3d'
import * as Matter from 'matter-js'

import { Camera, Scene } from '../../common/node_modules/@enable3d/three-wrapper/dist'

class MainScene extends Scene3D {
  ui: {
    camera: Camera
    scene: Scene
  }

  matter = new FLAT.MatterPhysics()
  ball: FLAT.SimpleSprite

  atlas: FLAT.Atlas
  shapes: string

  async preload() {
    // physics (fruits) TextureAtlas + Shapes
    this.atlas = await this.load.textureAtlas('/assets/fruit/fruit-sprites.png', '/assets/fruit/fruit-sprites.json')
    this.shapes = (await this.load.file('/assets/fruit/fruit-shapes.json')) as string

    // load texture and add to cache (Experimental)
    await this.load.texture('button_one', '/assets/button_sprite_sheet.png')
  }

  async addMatter() {
    const width = window.innerWidth
    const height = window.innerHeight

    this.matter.setBounds()

    const file = this.shapes
    const bodies = this.matter.parsePhysics(file)

    for (const fruit in this.atlas.json.frames) {
      if (fruit === 'background') continue
      //if (fruit !== 'banana') continue

      const f = new FLAT.TextureAtlas(this.atlas, fruit)
      this.ui.scene.add(f)

      let x = width / 2 + (Math.random() - 0.5) * Math.min(600, width)
      let y = 50 + Math.random() * 250

      if (fruit === 'ground') {
        x = width / 2
        y = height - f.currentFrameHeight / 2
      }

      f.body = this.matter.addBodyFromFixtures(x, y, bodies[fruit])
      this.matter.add.existing(f)

      if (fruit === 'ground') Matter.Body.setStatic(f.body, true)
    }
  }

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

    this.addMatter()
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
