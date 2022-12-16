/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|LGPL-3.0}
 */

declare global {
  namespace NodeJS {
    interface Global {
      THREE: any
      Zlib: any
      fflate: any
    }
  }
}

/**
 * Imports
 */
import { existsSync, readFile } from 'fs'

/**
 * FXBLoader imports
 */
import { FBXLoader as _FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'

/**
 * GLTFLoader imports
 * We import a custom modification of the GLTFLoader from 'three'.js
 * The original file is here 'three/examples/js/loaders/GLTFLoader'
 */
import { GLTFLoader as _GLTFLoader } from './lib/GLTFLoader'

class Loader {
  // https://gist.github.com/donmccurdy/323c6363ac7ca8a7de6a3362d7fdddb4
  trimBuffer = (buffer: any) => {
    const { byteOffset, byteLength } = buffer
    return buffer.buffer.slice(byteOffset, byteOffset + byteLength)
  }
}

export class FBXLoader extends Loader {
  private loader = new _FBXLoader()

  public load(absolutePath: string) {
    return new Promise((resolve, reject) => {
      try {
        if (!existsSync(absolutePath)) return reject('fbx file not found')

        readFile(absolutePath, (err: any, buffer: Buffer) => {
          if (err) throw err
          const trimmed = this.trimBuffer(buffer)
          try {
            const fbx = this.loader.parse(trimmed, '')
            if (fbx) return resolve(fbx)
          } catch (error: any) {
            return reject(error.message)
          }
        })
      } catch (error: any) {
        console.log('error', error.message)
        return reject(error.message)
      }
    })
  }
}

export class GLTFLoader extends Loader {
  private loader = new _GLTFLoader()

  public load(absolutePath: string) {
    return new Promise((resolve, reject) => {
      try {
        if (!existsSync(absolutePath)) return reject('gltf file not found')

        readFile(absolutePath, (err: any, buffer: Buffer) => {
          if (err) throw err
          const trimmed = this.trimBuffer(buffer)
          this.loader.parse(
            trimmed,
            '',
            (gltf: any) => {
              return resolve(gltf)
            },
            (err: any) => {
              return reject(err.message)
            }
          )
        })
      } catch (error: any) {
        return reject(error.message)
      }
    })
  }
}
