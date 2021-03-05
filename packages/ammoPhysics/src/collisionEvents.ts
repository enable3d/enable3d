/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { Events } from '@yandeu/events'
import { ExtendedObject3D, CollisionEvent } from '@enable3d/common/dist/types'
import { Types } from './physics'

export class CollisionEvents extends Events {
  public worldTransform: Ammo.btTransform
  public physicsWorld: Ammo.btDiscreteDynamicsWorld

  public addCollider(
    object1: ExtendedObject3D,
    object2: ExtendedObject3D,
    eventCallback: (event: CollisionEvent) => void
  ) {
    if (!object1.body || !object2.body) return

    object1.body.checkCollisions = true
    object2.body.checkCollisions = true

    this.on('collision', (data: { bodies: ExtendedObject3D[]; event: CollisionEvent }) => {
      const { bodies, event } = data
      if (bodies[0]?.name && bodies[1]?.name && object1?.name && object2?.name) {
        if (bodies[0].name === object1.name && bodies[1].name === object2.name) eventCallback(event)
        else if (bodies[1].name === object1.name && bodies[0].name === object2.name) eventCallback(event)
      }
    })
  }
}
