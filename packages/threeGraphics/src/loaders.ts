/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { GLTFLoader } from '@enable3d/three-wrapper/src/examples'
import { FBXLoader } from '@enable3d/three-wrapper/src/examples'

export default class Loaders {
  constructor() {}

  // protected loadGLTF(_key: string, _cb: Function) {
  //   const loader = new GLTFLoader()
  //   const data = this.root.cache.binary.get(key)
  //   loader.parse(data, '', object => cb(object))
  // }

  protected loadGLTF(url: string, onLoad: Function) {
    const loader = new GLTFLoader()
    loader.load(url, (gltf: any) => onLoad(gltf))
  }

  protected loadGLTFAsync(url: string) {
    return new Promise(resolve => {
      const loader = new GLTFLoader()
      loader.load(url, (gltf: any) => resolve(gltf))
    })
  }

  protected loadFBX(path: string, cb: (object: any) => void) {
    const loader = new FBXLoader()
    loader.load(path, (object: any) => {
      cb(object)
    })
  }
}
