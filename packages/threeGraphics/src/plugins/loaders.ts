/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { Cache, Group, TextureLoader, Texture, FileLoader, ImageLoader, ObjectLoader } from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader'
import { SVGLoader, SVGResult } from 'three/examples/jsm/loaders/SVGLoader'

import type { Atlas, JSONHash, JSONArrayFrames } from '../flat/textureAtlas'

export default class Loaders {
  private _fileLoader: FileLoader
  private _imgLoader: ImageLoader
  private _svgLoader: SVGLoader
  private _textureLoader: TextureLoader
  private _objectLoader: ObjectLoader
  private _gltfLoader: GLTFLoader
  private _fbxLoader: FBXLoader

  constructor(private cache: typeof Cache, private textureAnisotropy: number) {}

  private get fileLoader() {
    if (!this._fileLoader) this._fileLoader = new FileLoader()
    return this._fileLoader
  }
  private get imageLoader() {
    if (!this._imgLoader) this._imgLoader = new ImageLoader()
    return this._imgLoader
  }
  private get svgLoader() {
    if (!this._svgLoader) this._svgLoader = new SVGLoader()
    return this._svgLoader
  }
  private get textureLoader() {
    if (!this._textureLoader) this._textureLoader = new TextureLoader()
    return this._textureLoader
  }
  private get objectLoader() {
    if (!this._objectLoader) this._objectLoader = new ObjectLoader()
    return this._objectLoader
  }
  private get gltfLoader() {
    if (!this._gltfLoader) this._gltfLoader = new GLTFLoader()
    return this._gltfLoader
  }
  private get fbxLoader() {
    if (!this._fbxLoader) this._fbxLoader = new FBXLoader()
    return this._fbxLoader
  }

  public async preload(key: string, url: string) {
    this.cache.add(key, url)

    return new Promise(resolve => {
      const isModel = /\.fbx$|\.glb$|\.gltf$/.test(url)
      const isTexture = /\.jpe?g$|\.png$/.test(url)

      if (isTexture) {
        this.textureLoader.load(url, texture => {
          return resolve(texture)
        })
      } else {
        if (isModel) this.fileLoader.setResponseType('arraybuffer')
        this.fileLoader.load(url, file => {
          return resolve(file)
        })
      }
    })
  }

  public async textureAtlas(texture: string, json: string, _type = 'JSONHash'): Promise<Atlas> {
    let parsed = JSON.parse((await this.file(json)) as any)

    // convert JSONArray to JSONHash
    const isJSONArray = parsed.textures
    if (isJSONArray) {
      const frames = parsed.textures[0].frames as JSONArrayFrames

      let jsonHash: JSONHash = { frames: {} }

      frames.forEach(frame => {
        jsonHash = {
          ...jsonHash,
          frames: {
            ...jsonHash.frames,
            [frame.filename]: {
              frame: frame.frame,
              rotated: frame.rotated,
              sourceSize: frame.sourceSize,
              spriteSourceSize: frame.spriteSourceSize,
              trimmed: frame.trimmed
            }
          }
        }
      })

      parsed = jsonHash
    }

    const atlas = {
      texture: await this.texture(texture),
      json: parsed as JSONHash
    }

    return atlas
  }

  public file(url: string) {
    const key = this.cache.get(url)
    url = key ? key : url

    return new Promise(resolve => {
      this.fileLoader.load(url, file => {
        return resolve(file)
      })
    })
  }

  public svg(url: string): Promise<SVGResult> {
    const key = this.cache.get(url)
    url = key ? key : url

    return new Promise(resolve => {
      this.svgLoader.load(url, svg => {
        return resolve(svg)
      })
    })
  }

  public texture(url: string): Promise<Texture> {
    const isBase64 = /^data:image\/[\S]+;base64,/gm.test(url)

    // we do not want to cache base64 images
    if (!isBase64) {
      const key = this.cache.get(url)
      url = key ? key : url
    }

    return new Promise(resolve => {
      this.textureLoader.load(url, (texture: Texture) => {
        texture.anisotropy = this.textureAnisotropy
        texture.needsUpdate = true

        resolve(texture)
      })
    })
  }

  // examples: https://github.com/mrdoob/three.js/wiki/JSON-Object-Scene-format-4
  public object(url: string): Promise<any> {
    const key = this.cache.get(url)
    url = key ? key : url

    return new Promise(resolve => {
      this.objectLoader.load(url, (json: any) => {
        resolve(json)
      })
    })
  }

  public gltf(url: string): Promise<GLTF> {
    const key = this.cache.get(url)
    url = key ? key : url

    return new Promise(resolve => {
      this.gltfLoader.load(url, (gltf: GLTF) => {
        resolve(gltf)
      })
    })
  }

  public fbx(url: string): Promise<Group> {
    const key = this.cache.get(url)
    url = key ? key : url

    return new Promise(resolve => {
      this.fbxLoader.load(url, (fbx: Group) => {
        resolve(fbx)
      })
    })
  }
}
