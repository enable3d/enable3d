/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { Texture, TextureLoader, RGBAFormat, RepeatWrapping, Material } from '@enable3d/three-wrapper/src/index'
// import { Scene } from 'phaser'
import logger from '@enable3d/common/src/logger'

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

export default class Textures {
  protected add: any
  protected textureAnisotropy: number

  // loading from phaser cache would be like:
  // texture.image = this.root.textures.get(key).getSourceImage()

  protected textureCube(textures: Texture[]) {
    if (textures.length !== 6) {
      logger('You need to pass 6 urls to textureCube()')
    }

    const textureCube = new TextureCube()

    textures.forEach((texture, i) => {
      texture.wrapS = texture.wrapT = RepeatWrapping
      const material: Material = this.add.material({ phong: { map: texture } })
      textureCube.materials[i] = material
    })

    return textureCube
  }

  protected loadTexture(url: string): Texture {
    const loader = new TextureLoader()
    const texture = loader.load(url)
    texture.anisotropy = this.textureAnisotropy
    // example to repeat a texture
    // texture.wrapS = texture.wrapT = RepeatWrapping
    // texture.offset.set(0, 0)
    // texture.repeat.set(10, 10)
    return texture
  }

  protected loadTextureAsync(url: string) {
    return new Promise(resolve => {
      const loader = new TextureLoader()
      loader.load(url, texture => {
        texture.anisotropy = this.textureAnisotropy
        // example to repeat a texture
        // texture.wrapS = texture.wrapT = RepeatWrapping
        // texture.offset.set(0, 0)
        // texture.repeat.set(10, 10)
        resolve(texture)
      })
    })
  }
}
