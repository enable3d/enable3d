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
  RGBAFormat
} from '@enable3d/three-wrapper/dist/index'

export default class Loaders {
  constructor(private cache: typeof Cache, private textureAnisotropy: number) {}

  public getFromCache(cacheKey: string) {
    if (cacheKey === '') return
    return this.cache.get(cacheKey)
  }

  public addToCache(cacheKey: string, file: any) {
    if (cacheKey === '') return
    this.cache.add(cacheKey, file)
  }

  // method overloading https://stackoverflow.com/a/12689054/12656855
  public svg(url: string): Promise<SVGResult>
  public svg(cacheKey: string, url: string): Promise<SVGResult>
  public svg(urlOrCacheKey: string, url?: string): Promise<SVGResult> {
    let cacheKey = ''
    let URL = url || ''

    if (url && typeof url == 'string') cacheKey = urlOrCacheKey
    else URL = urlOrCacheKey

    return new Promise(resolve => {
      // first check the cache
      const file = this.getFromCache(cacheKey)
      if (file) return resolve(file)

      const loader = new SVGLoader()
      loader.load(URL, svg => {
        this.addToCache(cacheKey, svg)
        return resolve(svg)
      })
    })
  }

  // method overloading https://stackoverflow.com/a/12689054/12656855
  public texture(url: string): Promise<Texture>
  public texture(cacheKey: string, url: string): Promise<Texture>
  public texture(urlOrCacheKey: string, url?: string): Promise<Texture> {
    let cacheKey = ''
    let URL = url || ''

    if (url && typeof url == 'string') cacheKey = urlOrCacheKey
    else URL = urlOrCacheKey

    return new Promise(resolve => {
      // first check the cache
      const file = this.getFromCache(cacheKey)
      if (file) return resolve(file)

      const loader = new TextureLoader()
      loader.load(URL, (texture: Texture) => {
        // options
        texture.anisotropy = this.textureAnisotropy
        texture.format = RGBAFormat
        texture.needsUpdate = true
        texture.anisotropy = this.textureAnisotropy
        // texture.encoding = sRGBEncoding

        this.addToCache(cacheKey, texture)
        resolve(texture)
      })
    })
  }

  // method overloading https://stackoverflow.com/a/12689054/12656855
  public gltf(url: string): Promise<GLTF>
  public gltf(cacheKey: string, url: string): Promise<GLTF>

  public gltf(urlOrCacheKey: string, url?: string): Promise<GLTF> {
    let cacheKey = ''
    let URL = url || ''

    if (url && typeof url == 'string') cacheKey = urlOrCacheKey
    else URL = urlOrCacheKey

    return new Promise(resolve => {
      // first check the cache
      const file = this.getFromCache(cacheKey)
      if (file) return resolve(file)

      const loader = new GLTFLoader()
      loader.load(URL, (gltf: GLTF) => {
        this.addToCache(cacheKey, gltf)
        resolve(gltf)
      })
    })
  }

  // method overloading https://stackoverflow.com/a/12689054/12656855
  public fbx(url: string): Promise<Group>
  public fbx(cacheKey: string, url: string): Promise<Group>
  public fbx(urlOrCacheKey: string, url?: string): Promise<Group> {
    let cacheKey = ''
    let URL = url || ''

    if (url && typeof url == 'string') cacheKey = urlOrCacheKey
    else URL = urlOrCacheKey

    return new Promise(resolve => {
      // first check the cache
      const file = this.getFromCache(cacheKey)
      if (file) return resolve(file)

      const loader = new FBXLoader()
      loader.load(URL, (fbx: Group) => {
        this.addToCache(cacheKey, fbx)
        resolve(fbx)
      })
    })
  }
}
