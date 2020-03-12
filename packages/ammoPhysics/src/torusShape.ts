/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { Quaternion } from '@enable3d/three-wrapper/src/index'

// https://pybullet.org/Bullet/phpBB3/viewtopic.php?t=7228
export const addTorusShape = (config: { radius: number; tube: number; tubularSegments: number }, quat: Quaternion) => {
  const { radius = 1, tube = 0.4, tubularSegments = 8 } = config

  const SIMD_PI = Math.PI
  const subdivisions = tubularSegments
  const gap = Math.sqrt(2.0 * tube * tube - 2.0 * tube * tube * Math.cos((2.0 * SIMD_PI) / subdivisions))

  const btHalfExtents = new Ammo.btVector3(tube, SIMD_PI / subdivisions + 0.5 * gap, tube)
  const cylinderShape = new Ammo.btCylinderShape(btHalfExtents)
  cylinderShape.setMargin(0.05)

  const compoundShape = new Ammo.btCompoundShape()

  const forward = new Ammo.btVector3(0, 0, 1)
  const side = new Ammo.btVector3(0, radius, 0)
  const rotation = new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)

  for (let x = 0; x < subdivisions; x++) {
    const angle = (x * 2.0 * SIMD_PI) / subdivisions
    const position = side.rotate(forward, angle)
    const transform = new Ammo.btTransform()
    rotation.setRotation(forward, angle + Math.PI / 2)
    transform.setIdentity()
    transform.setOrigin(position)
    transform.setRotation(rotation)
    compoundShape.addChildShape(transform, cylinderShape)
  }

  return compoundShape
}
