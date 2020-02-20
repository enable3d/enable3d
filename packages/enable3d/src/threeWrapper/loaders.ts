/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'

export default class Loaders {
  constructor(public root: Phaser.Scene) {}

  protected loadGLTF(key: string, cb: Function) {
    const loader = new GLTFLoader()
    const data = this.root.cache.binary.get(key)
    loader.parse(data, '', object => cb(object))
  }

  protected loadFBX(path: string, cb: (object: any) => void) {
    const loader = new FBXLoader()
    loader.load(path, (object: any) => {
      cb(object)
    })
  }
}
