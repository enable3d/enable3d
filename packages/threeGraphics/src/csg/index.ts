/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2022 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { Mesh } from 'three'
import { CSG } from 'three-csg-ts'

/**
 * CSG wrapper for enable3d
 *
 * The CSG library does not support buffer geometries.
 * Means we first make sure we are dealing with geometries
 * and then transform them back to buffer geometries.
 */
class CSGWrapper {
  static union(meshA: Mesh, meshB: Mesh): Mesh {
    const meshC = this.doCSG(meshA, meshB, 'union')
    return meshC
  }

  static subtract(meshA: Mesh, meshB: Mesh): Mesh {
    const meshC = this.doCSG(meshA, meshB, 'subtract')
    return meshC
  }

  static intersect(meshA: any, meshB: any): Mesh {
    const meshC = this.doCSG(meshA, meshB, 'intersect')
    return meshC
  }

  static doCSG(meshA: any, meshB: any, operation: 'union' | 'subtract' | 'intersect'): Mesh {
    meshA.updateMatrix()
    meshB.updateMatrix()

    if (operation === 'union') return CSG.union(meshA, meshB)
    if (operation === 'subtract') return CSG.subtract(meshA, meshB)
    if (operation === 'intersect') return CSG.intersect(meshA, meshB)

    return undefined as unknown as Mesh
  }
}

export { CSGWrapper as CSG }
