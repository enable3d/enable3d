// base on https://codesandbox.io/s/three-nebula-quickstart-kz6uv

import { PhysicsLoader, Project, Scene3D, THREE } from 'enable3d'

// @ts-ignore
import Nebula, { SpriteRenderer } from 'three-nebula'
import json from './my-particle-system.json'

class MainScene extends Scene3D {
  nebulaRenderer = new SpriteRenderer(this.scene, THREE)
  nebula: any

  preRender() {
    if (this.nebula) this.nebula.update()
  }

  async create() {
    await this.warpSpeed()

    Nebula.fromJSONAsync(json, THREE).then((loaded: any) => {
      const nebulaRenderer = new SpriteRenderer(this.scene, THREE)
      this.nebula = loaded.addRenderer(nebulaRenderer)
    })
  }
}

const startProject = () => {
  PhysicsLoader('/lib', () => new Project({ scenes: [MainScene] }))
}

export default startProject
