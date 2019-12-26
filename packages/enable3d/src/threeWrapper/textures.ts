/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2019 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { Texture, TextureLoader } from 'three'
import { Scene } from 'phaser'

export default class Textures {
  protected textureAnisotropy: number
  constructor(public root: Scene) {}
  public getTexture(key: string) {
    let texture = new Texture()

    texture.image = this.root.textures.get(key).getSourceImage()

    // texture.format = THREE.RGBAFormat
    texture.needsUpdate = true
    texture.anisotropy = this.textureAnisotropy

    return texture
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

  protected loadAsyncTexture(url: string): Promise<Texture> {
    const loader = new TextureLoader()
    return new Promise((resolve, reject) => {
      loader.load(
        url,
        texture => {
          resolve(texture)
        },
        undefined,
        error => {
          reject(error.message)
        }
      )
    })
  }
}
