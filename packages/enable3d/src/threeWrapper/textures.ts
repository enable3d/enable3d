/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2019 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { Texture, TextureLoader, RGBAFormat, sRGBEncoding, RepeatWrapping, Material } from 'three'
import { Scene } from 'phaser'
import logger from '../helpers/logger'

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

  constructor(public root: Scene) {}

  /** Use third.texture.get(KEY) instead. */
  public getTexture(key: string) {
    logger(`[Texture ${key}] getTexture() is deprecated. Use third.texture.get(${key}) instead.`)
  }

  protected _getTexture(key: string) {
    const texture = new Texture()

    texture.image = this.root.textures.get(key).getSourceImage()

    texture.format = RGBAFormat
    texture.needsUpdate = true
    texture.anisotropy = this.textureAnisotropy
    // texture.encoding = sRGBEncoding

    return texture
  }

  protected textureCube(textures: string[]) {
    if (textures.length !== 6) {
      logger('You need to pass 6 textures to textureCube()')
    }

    const textureCube = new TextureCube()

    textures.forEach((key, i) => {
      const texture = this._getTexture(key)
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
}
