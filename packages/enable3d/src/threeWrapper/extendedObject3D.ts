/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2019 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { AnimationClip, AnimationMixer, Mesh, Line, Points, Object3D } from 'three'
import PhysicsBody from '../ammoWrapper/physicsBody'
import { AnimationAction } from 'three/src/animation/AnimationAction'
import logger from '../helpers/logger'

interface ExtendedObject3D extends Line, Mesh, Points {
  isLine: any
  isPoints: any
  isMesh: any
  type: any
}

/**
 * Extends the Object3D class from THREE.js and implements properties from Line, Mesh and Points.
 */
class ExtendedObject3D extends Object3D {
  shape: string
  name: string
  body: PhysicsBody
  hasBody: boolean = false
  animations?: AnimationClip[]
  mixer?: AnimationMixer
  anims: { [key: string]: AnimationClip } = {}
  action: AnimationAction
  currentAnimation: string = ''
  breakable: boolean
  fragmentDepth: number
  collided: boolean

  setAction(name: string) {
    if (this.mixer && this.anims.hasOwnProperty(name)) {
      const action = this.mixer?.clipAction(this.anims[name])
      action.time = 0
      this.mixer.stopAllAction()
      action.fadeIn(0.5)
      action.play()
      this.currentAnimation = name
    } else {
      logger(`[Phaser3D] Can't set animation ${name}`)
    }
  }
}

export default ExtendedObject3D
