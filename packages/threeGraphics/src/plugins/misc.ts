// misc
import { addWater, AddWaterConfig } from './water'
import { Scene, WebGLRenderer, Material, Texture, RepeatWrapping } from 'three'
import { Factories } from '.'

export default class Misc {
  constructor(private scene: Scene, private renderer: WebGLRenderer, private factories: Factories) {}

  public water(config: AddWaterConfig = {}) {
    addWater(this.scene, this.renderer, config)
  }

  public textureCube(textures: Texture[]) {
    if (textures.length !== 6) {
      console.log('[enable3d] You need to pass 6 urls to textureCube()')
    }

    const textureCube = new TextureCube()

    textures.forEach((texture, i) => {
      texture.wrapS = texture.wrapT = RepeatWrapping
      const material: Material = this.factories.add.material({ phong: { map: texture } }) as Material
      textureCube.materials[i] = material
    })

    return textureCube
  }
}

export class TextureCube {
  public materials: Material[]

  constructor() {
    this.materials = new Array(6)
  }

  public get texture() {
    return {
      left: this.getTexture(0),
      right: this.getTexture(1),
      up: this.getTexture(2),
      down: this.getTexture(3),
      front: this.getTexture(4),
      back: this.getTexture(5)
    }
  }

  private getTexture(i: number) {
    // @ts-ignore
    return this.materials[i].map as Texture
  }
}
