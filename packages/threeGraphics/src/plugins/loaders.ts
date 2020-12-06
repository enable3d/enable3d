/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import {
  Cache,
  GLTFLoader,
  GLTF,
  FBXLoader,
  Group,
  TextureLoader,
  Texture,
  SVGLoader,
  SVGResult,
  RGBAFormat,
  FileLoader,
  ImageLoader,
  ObjectLoader,
  sRGBEncoding,
  TextureEncoding
} from '@enable3d/three-wrapper/dist/index'

export default class Loaders {
  private _fileLoader: FileLoader
  private _imgLoader: ImageLoader
  private _svgLoader: SVGLoader
  private _textureLoader: TextureLoader
  private _objectLoader: ObjectLoader
  private _gltfLoader: GLTFLoader
  private _fbxLoader: FBXLoader

  constructor(private cache: typeof Cache, private textureAnisotropy: number, private encoding: TextureEncoding) {}

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
        // options
        texture.anisotropy = this.textureAnisotropy
        texture.format = RGBAFormat
        texture.needsUpdate = true
        texture.anisotropy = this.textureAnisotropy

        texture.encoding = this.encoding
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
