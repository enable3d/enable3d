/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2019 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import EventEmitter from 'eventemitter3'
import { ExtendedObject3D } from '../types'

export default class Events extends EventEmitter {
  public tmpTrans: Ammo.btTransform
  public physicsWorld: Ammo.btDiscreteDynamicsWorld

  // TODO this is not finished yet
  protected addCollider(
    object1: ExtendedObject3D,
    object2: ExtendedObject3D,
    eventCallback: (event: 'start' | 'collision' | 'end') => void
  ) {
    this.on('collision', data => {
      const { bodies, event } = data
      if (bodies[0]?.name && bodies[1]?.name && object1?.name && object2?.name) {
        if (bodies[0].name === object1.name && bodies[1].name === object2.name) eventCallback(event)
        else if (bodies[1].name === object1.name && bodies[0].name === object2.name) eventCallback(event)
      }
    })
  }
}
