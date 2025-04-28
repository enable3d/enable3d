/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|LGPL-3.0}
 */

import { Cache, FileLoader, Group, ImageLoader, ObjectLoader, Texture, TextureLoader } from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { SVGLoader, SVGResult } from 'three/examples/jsm/loaders/SVGLoader.js'

import type { Atlas, JSONArrayFrames, JSONHash } from '../flat/textureAtlas.js'

export default class Loaders {
  private _fileLoader!: FileLoader
  private _imgLoader!: ImageLoader
  private _svgLoader!: SVGLoader
  private _textureLoader!: TextureLoader
  private _objectLoader!: ObjectLoader
  private _gltfLoader!: GLTFLoader
  private _fbxLoader!: FBXLoader

  constructor(
    private cache: typeof Cache,
    private textureAnisotropy: number
  ) {}

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
        else this.fileLoader.setResponseType('undefined')
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

      frames.forEach((frame: any) => {
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
    const cachedPayload = this.cache.get(url);
    if (cachedPayload) {
      return Promise.resolve(cachedPayload);
    }

    return new Promise(resolve => {
      this.fileLoader.load(url, file => {
        this.cache.add(url, file); // Cache the loaded file
        resolve(file);
      });
    });
  }

  public svg(url: string): Promise<SVGResult> {
    const cachedPayload = this.cache.get(url);
    if (cachedPayload) {
      return Promise.resolve(cachedPayload);
    }

    return new Promise(resolve => {
      this.svgLoader.load(url, svg => {
        this.cache.add(url, svg); // Cache the loaded SVG
        resolve(svg);
      });
    });
  }

  public texture(url: string): Promise<Texture> {
    const isBase64 = /^data:image\/[\S]+;base64,/gm.test(url);

    // We do not want to cache base64 images
    if (!isBase64) {
      const cachedPayload = this.cache.get(url);
      if (cachedPayload) {
        return Promise.resolve(cachedPayload);
      }
    }

    return new Promise(resolve => {
      this.textureLoader.load(url, (texture: Texture) => {
        texture.anisotropy = this.textureAnisotropy;
        texture.needsUpdate = true;

        if (!isBase64) {
          this.cache.add(url, texture); // Cache the loaded texture
        }

        resolve(texture);
      });
    });
  }

  // examples: https://github.com/mrdoob/three.js/wiki/JSON-Object-Scene-format-4
  public object(url: string): Promise<any> {
    const cachedPayload = this.cache.get(url);
    if (cachedPayload) {
      return Promise.resolve(cachedPayload);
    }

    return new Promise(resolve => {
      this.objectLoader.load(url, (json: any) => {
        this.cache.add(url, json); // Cache the loaded object
        resolve(json);
      });
    });
  }

  public gltf(url: string): Promise<GLTF> {
    const cachedPayload = this.cache.get(url);
    if (cachedPayload) {
      return Promise.resolve(cachedPayload);
    }

    return new Promise(resolve => {
      this.gltfLoader.load(url, (gltf: GLTF) => {
        this.cache.add(url, gltf); // Cache the loaded GLTF
        resolve(gltf);
      });
    });
  }

  public fbx(url: string): Promise<Group> {
    const cachedPayload = this.cache.get(url);
    if (cachedPayload) {
      return Promise.resolve(cachedPayload);
    }

    return new Promise(resolve => {
      this.fbxLoader.load(url, (fbx: Group) => {
        this.cache.add(url, fbx); // Cache the loaded FBX
        resolve(fbx);
      });
    });
  }
}
