/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @description  This is a modified version of the original code from Kevin Lee
 * (Includes latest three-to-ammo commit from August 6, 2020)
 */

/**
 * @author       Kevin Lee (https://github.com/InfiniteLee)
 * @copyright    Copyright (c) 2020 Kevin Lee; Project Url: https://github.com/InfiniteLee/three-to-ammo
 * @license      {@link https://github.com/InfiniteLee/three-to-ammo/blob/master/LICENSE|MPL-2.0}
 */

import { Vector3, Matrix4, Quaternion, Box3, REVISION } from '@enable3d/three-wrapper/dist/index'
;('use strict')
/* global Ammo */

export const TYPE = {
  BOX: 'box',
  CYLINDER: 'cylinder',
  SPHERE: 'sphere',
  CAPSULE: 'capsule',
  CONE: 'cone',
  HULL: 'hull',
  HACD: 'hacd', //Hierarchical Approximate Convex Decomposition
  VHACD: 'vhacd', //Volumetric Hierarchical Approximate Convex Decomposition
  MESH: 'mesh',
  HEIGHTFIELD: 'heightfield'
}

export const FIT = {
  ALL: 'all', //A single shape is automatically sized to bound all meshes within the entity.
  MANUAL: 'manual' //A single shape is sized manually. Requires halfExtents or sphereRadius.
}

export const HEIGHTFIELD_DATA_TYPE = {
  short: 'short',
  float: 'float'
}

export const createCollisionShapes = function (vertices, matrices, indexes, matrixWorld, options = {}) {
  switch (options.type) {
    case TYPE.BOX:
      return [createBoxShape(vertices, matrices, matrixWorld, options)]
    case TYPE.CYLINDER:
      return [createCylinderShape(vertices, matrices, matrixWorld, options)]
    case TYPE.CAPSULE:
      return [createCapsuleShape(vertices, matrices, matrixWorld, options)]
    case TYPE.CONE:
      return [createConeShape(vertices, matrices, matrixWorld, options)]
    case TYPE.SPHERE:
      return [createSphereShape(vertices, matrices, matrixWorld, options)]
    case TYPE.HULL:
      return [createHullShape(vertices, matrices, matrixWorld, options)]
    case TYPE.HACD:
      return createHACDShapes(vertices, matrices, indexes, matrixWorld, options)
    case TYPE.VHACD:
      return createVHACDShapes(vertices, matrices, indexes, matrixWorld, options)
    case TYPE.MESH:
      return [createTriMeshShape(vertices, matrices, indexes, matrixWorld, options)]
    case TYPE.HEIGHTFIELD:
      return [createHeightfieldTerrainShape(options)]
    default:
      console.warn(options.type + ' is not currently supported')
      return []
  }
}

//TODO: support gimpact (dynamic trimesh) and heightmap

export const createBoxShape = function (vertices, matrices, matrixWorld, options = {}) {
  options.type = TYPE.BOX
  _setOptions(options)

  if (options.fit === FIT.ALL) {
    options.halfExtents = _computeHalfExtents(
      _computeBounds(vertices, matrices),
      options.minHalfExtent,
      options.maxHalfExtent
    )
  }

  const btHalfExtents = new Ammo.btVector3(options.halfExtents.x, options.halfExtents.y, options.halfExtents.z)
  const collisionShape = new Ammo.btBoxShape(btHalfExtents)
  Ammo.destroy(btHalfExtents)

  _finishCollisionShape(collisionShape, options, _computeScale(matrixWorld, options))
  return collisionShape
}

export const createCylinderShape = function (vertices, matrices, matrixWorld, options = {}) {
  options.type = TYPE.CYLINDER
  _setOptions(options)

  if (options.fit === FIT.ALL) {
    options.halfExtents = _computeHalfExtents(
      _computeBounds(vertices, matrices),
      options.minHalfExtent,
      options.maxHalfExtent
    )
  }

  const btHalfExtents = new Ammo.btVector3(options.halfExtents.x, options.halfExtents.y, options.halfExtents.z)
  const collisionShape = (() => {
    switch (options.cylinderAxis) {
      case 'y':
        return new Ammo.btCylinderShape(btHalfExtents)
      case 'x':
        return new Ammo.btCylinderShapeX(btHalfExtents)
      case 'z':
        return new Ammo.btCylinderShapeZ(btHalfExtents)
    }
    return null
  })()
  Ammo.destroy(btHalfExtents)

  _finishCollisionShape(collisionShape, options, _computeScale(matrixWorld, options))
  return collisionShape
}

export const createCapsuleShape = function (vertices, matrices, matrixWorld, options = {}) {
  options.type = TYPE.CAPSULE
  _setOptions(options)

  if (options.fit === FIT.ALL) {
    options.halfExtents = _computeHalfExtents(
      _computeBounds(vertices, matrices),
      options.minHalfExtent,
      options.maxHalfExtent
    )
  }

  const { x, y, z } = options.halfExtents
  const collisionShape = (() => {
    switch (options.cylinderAxis) {
      case 'y':
        return new Ammo.btCapsuleShape(Math.max(x, z), y * 2)
      case 'x':
        return new Ammo.btCapsuleShapeX(Math.max(y, z), x * 2)
      case 'z':
        return new Ammo.btCapsuleShapeZ(Math.max(x, y), z * 2)
    }
    return null
  })()

  _finishCollisionShape(collisionShape, options, _computeScale(matrixWorld, options))
  return collisionShape
}

export const createConeShape = function (vertices, matrices, matrixWorld, options = {}) {
  options.type = TYPE.CONE
  _setOptions(options)

  if (options.fit === FIT.ALL) {
    options.halfExtents = _computeHalfExtents(
      _computeBounds(vertices, matrices),
      options.minHalfExtent,
      options.maxHalfExtent
    )
  }

  const { x, y, z } = options.halfExtents
  const collisionShape = (() => {
    switch (options.cylinderAxis) {
      case 'y':
        return new Ammo.btConeShape(Math.max(x, z), y * 2)
      case 'x':
        return new Ammo.btConeShapeX(Math.max(y, z), x * 2)
      case 'z':
        return new Ammo.btConeShapeZ(Math.max(x, y), z * 2)
    }
    return null
  })()

  _finishCollisionShape(collisionShape, options, _computeScale(matrixWorld, options))
  return collisionShape
}

export const createSphereShape = function (vertices, matrices, matrixWorld, options = {}) {
  options.type = TYPE.SPHERE
  _setOptions(options)

  let radius
  if (options.fit === FIT.MANUAL && !isNaN(options.sphereRadius)) {
    radius = options.sphereRadius
  } else {
    radius = _computeRadius(vertices, matrices, _computeBounds(vertices, matrices))
  }

  const collisionShape = new Ammo.btSphereShape(radius)
  _finishCollisionShape(collisionShape, options, _computeScale(matrixWorld, options))

  return collisionShape
}

export const createHullShape = (function () {
  const vertex = new Vector3()
  const center = new Vector3()
  const matrix = new Matrix4()
  return function (vertices, matrices, matrixWorld, options = {}) {
    options.type = TYPE.HULL
    _setOptions(options)

    if (options.fit === FIT.MANUAL) {
      console.warn('cannot use fit: manual with type: hull')
      return null
    }

    const bounds = _computeBounds(vertices, matrices)

    const btVertex = new Ammo.btVector3()
    const originalHull = new Ammo.btConvexHullShape()
    originalHull.setMargin(options.margin)
    center.addVectors(bounds.max, bounds.min).multiplyScalar(0.5)

    let vertexCount = 0
    for (let i = 0; i < vertices.length; i++) {
      vertexCount += vertices[i].length / 3
    }

    const maxVertices = options.hullMaxVertices || 100000
    // todo: might want to implement this in a deterministic way that doesn't do O(verts) calls to Math.random
    if (vertexCount > maxVertices) {
      console.warn(`too many vertices for hull shape; sampling ~${maxVertices} from ~${vertexCount} vertices`)
    }
    const p = Math.min(1, maxVertices / vertexCount)

    for (let i = 0; i < vertices.length; i++) {
      const components = vertices[i]
      matrix.fromArray(matrices[i])
      for (let j = 0; j < components.length; j += 3) {
        const isLastVertex = i === vertices.length - 1 && j === components.length - 3
        if (Math.random() <= p || isLastVertex) {
          // always include the last vertex
          vertex
            .set(components[j], components[j + 1], components[j + 2])
            .applyMatrix4(matrix)
            .sub(center)
          btVertex.setValue(vertex.x, vertex.y, vertex.z)
          originalHull.addPoint(btVertex, isLastVertex) // recalc AABB only on last geometry
        }
      }
    }

    let collisionShape = originalHull
    if (originalHull.getNumVertices() >= 100) {
      //Bullet documentation says don't use convexHulls with 100 verts or more
      const shapeHull = new Ammo.btShapeHull(originalHull)
      shapeHull.buildHull(options.margin)
      Ammo.destroy(originalHull)
      collisionShape = new Ammo.btConvexHullShape(
        Ammo.getPointer(shapeHull.getVertexPointer()),
        shapeHull.numVertices()
      )
      Ammo.destroy(shapeHull) // btConvexHullShape makes a copy
    }

    Ammo.destroy(btVertex)

    _finishCollisionShape(collisionShape, options, _computeScale(matrixWorld, options))
    return collisionShape
  }
})()

export const createHACDShapes = (function () {
  const vector = new Vector3()
  const center = new Vector3()
  const matrix = new Matrix4()
  return function (vertices, matrices, indexes, matrixWorld, options = {}) {
    options.type = TYPE.HACD
    _setOptions(options)

    if (options.fit === FIT.MANUAL) {
      console.warn('cannot use fit: manual with type: hacd')
      return []
    }

    if (!Ammo.hasOwnProperty('HACD')) {
      console.warn(
        'HACD unavailable in included build of Ammo.js. Visit https://github.com/mozillareality/ammo.js for the latest version.'
      )
      return []
    }

    const bounds = _computeBounds(vertices, matrices)
    const scale = _computeScale(matrixWorld, options)

    let vertexCount = 0
    let triCount = 0
    center.addVectors(bounds.max, bounds.min).multiplyScalar(0.5)

    for (let i = 0; i < vertices.length; i++) {
      vertexCount += vertices[i].length / 3
      if (indexes && indexes[i]) {
        triCount += indexes[i].length / 3
      } else {
        triCount += vertices[i].length / 9
      }
    }

    const hacd = new Ammo.HACD()
    if (options.hasOwnProperty('compacityWeight')) hacd.SetCompacityWeight(options.compacityWeight)
    if (options.hasOwnProperty('volumeWeight')) hacd.SetVolumeWeight(options.volumeWeight)
    if (options.hasOwnProperty('nClusters')) hacd.SetNClusters(options.nClusters)
    if (options.hasOwnProperty('nVerticesPerCH')) hacd.SetNVerticesPerCH(options.nVerticesPerCH)
    if (options.hasOwnProperty('concavity')) hacd.SetConcavity(options.concavity)

    const points = Ammo._malloc(vertexCount * 3 * 8)
    const triangles = Ammo._malloc(triCount * 3 * 4)
    hacd.SetPoints(points)
    hacd.SetTriangles(triangles)
    hacd.SetNPoints(vertexCount)
    hacd.SetNTriangles(triCount)

    let pptr = points / 8,
      tptr = triangles / 4

    for (let i = 0; i < vertices.length; i++) {
      const components = vertices[i]
      matrix.fromArray(matrices[i])
      for (let j = 0; j < components.length; j += 3) {
        vector
          .set(components[j + 0], components[j + 1], components[j + 2])
          .applyMatrix4(matrix)
          .sub(center)
        Ammo.HEAPF64[pptr + 0] = vector.x
        Ammo.HEAPF64[pptr + 1] = vector.y
        Ammo.HEAPF64[pptr + 2] = vector.z
        pptr += 3
      }
      if (indexes[i]) {
        const indices = indexes[i]
        for (let j = 0; j < indices.length; j++) {
          Ammo.HEAP32[tptr] = indices[j]
          tptr++
        }
      } else {
        for (let j = 0; j < components.length / 3; j++) {
          Ammo.HEAP32[tptr] = j
          tptr++
        }
      }
    }

    hacd.Compute()
    Ammo._free(points)
    Ammo._free(triangles)
    const nClusters = hacd.GetNClusters()

    const shapes = []
    for (let i = 0; i < nClusters; i++) {
      const hull = new Ammo.btConvexHullShape()
      hull.setMargin(options.margin)
      const nPoints = hacd.GetNPointsCH(i)
      const nTriangles = hacd.GetNTrianglesCH(i)
      const hullPoints = Ammo._malloc(nPoints * 3 * 8)
      const hullTriangles = Ammo._malloc(nTriangles * 3 * 4)
      hacd.GetCH(i, hullPoints, hullTriangles)

      const pptr = hullPoints / 8
      for (let pi = 0; pi < nPoints; pi++) {
        const btVertex = new Ammo.btVector3()
        const px = Ammo.HEAPF64[pptr + pi * 3 + 0]
        const py = Ammo.HEAPF64[pptr + pi * 3 + 1]
        const pz = Ammo.HEAPF64[pptr + pi * 3 + 2]
        btVertex.setValue(px, py, pz)
        hull.addPoint(btVertex, pi === nPoints - 1)
        Ammo.destroy(btVertex)
      }

      _finishCollisionShape(hull, options, scale)
      shapes.push(hull)
    }

    return shapes
  }
})()

export const createVHACDShapes = (function () {
  const vector = new Vector3()
  const center = new Vector3()
  const matrix = new Matrix4()
  return function (vertices, matrices, indexes, matrixWorld, options = {}) {
    options.type = TYPE.VHACD
    _setOptions(options)

    if (options.fit === FIT.MANUAL) {
      console.warn('cannot use fit: manual with type: vhacd')
      return []
    }

    if (!Ammo.hasOwnProperty('VHACD')) {
      console.warn(
        'VHACD unavailable in included build of Ammo.js. Visit https://github.com/mozillareality/ammo.js for the latest version.'
      )
      return []
    }

    const bounds = _computeBounds(vertices, matrices)
    const scale = _computeScale(matrixWorld, options)

    let vertexCount = 0
    let triCount = 0
    center.addVectors(bounds.max, bounds.min).multiplyScalar(0.5)

    for (let i = 0; i < vertices.length; i++) {
      vertexCount += vertices[i].length / 3
      if (indexes && indexes[i]) {
        triCount += indexes[i].length / 3
      } else {
        triCount += vertices[i].length / 9
      }
    }

    const vhacd = new Ammo.VHACD()
    const params = new Ammo.Parameters()
    //https://kmamou.blogspot.com/2014/12/v-hacd-20-parameters-description.html
    if (options.hasOwnProperty('resolution')) params.set_m_resolution(options.resolution)
    if (options.hasOwnProperty('depth')) params.set_m_depth(options.depth)
    if (options.hasOwnProperty('concavity')) params.set_m_concavity(options.concavity)
    if (options.hasOwnProperty('planeDownsampling')) params.set_m_planeDownsampling(options.planeDownsampling)
    if (options.hasOwnProperty('convexhullDownsampling'))
      params.set_m_convexhullDownsampling(options.convexhullDownsampling)
    if (options.hasOwnProperty('alpha')) params.set_m_alpha(options.alpha)
    if (options.hasOwnProperty('beta')) params.set_m_beta(options.beta)
    if (options.hasOwnProperty('gamma')) params.set_m_gamma(options.gamma)
    if (options.hasOwnProperty('pca')) params.set_m_pca(options.pca)
    if (options.hasOwnProperty('mode')) params.set_m_mode(options.mode)
    if (options.hasOwnProperty('maxNumVerticesPerCH')) params.set_m_maxNumVerticesPerCH(options.maxNumVerticesPerCH)
    if (options.hasOwnProperty('minVolumePerCH')) params.set_m_minVolumePerCH(options.minVolumePerCH)
    if (options.hasOwnProperty('convexhullApproximation'))
      params.set_m_convexhullApproximation(options.convexhullApproximation)
    if (options.hasOwnProperty('oclAcceleration')) params.set_m_oclAcceleration(options.oclAcceleration)

    const points = Ammo._malloc(vertexCount * 3 * 8 + 3)
    const triangles = Ammo._malloc(triCount * 3 * 4)

    let pptr = points / 8,
      tptr = triangles / 4

    for (let i = 0; i < vertices.length; i++) {
      const components = vertices[i]
      matrix.fromArray(matrices[i])
      for (let j = 0; j < components.length; j += 3) {
        vector
          .set(components[j + 0], components[j + 1], components[j + 2])
          .applyMatrix4(matrix)
          .sub(center)
        Ammo.HEAPF64[pptr + 0] = vector.x
        Ammo.HEAPF64[pptr + 1] = vector.y
        Ammo.HEAPF64[pptr + 2] = vector.z
        pptr += 3
      }
      if (indexes[i]) {
        const indices = indexes[i]
        for (let j = 0; j < indices.length; j++) {
          Ammo.HEAP32[tptr] = indices[j]
          tptr++
        }
      } else {
        for (let j = 0; j < components.length / 3; j++) {
          Ammo.HEAP32[tptr] = j
          tptr++
        }
      }
    }
    vhacd.Compute(points, 3, vertexCount, triangles, 3, triCount, params)
    Ammo._free(points)
    Ammo._free(triangles)
    const nHulls = vhacd.GetNConvexHulls()

    const shapes = []
    const ch = new Ammo.ConvexHull()
    for (let i = 0; i < nHulls; i++) {
      vhacd.GetConvexHull(i, ch)
      const nPoints = ch.get_m_nPoints()
      const hullPoints = ch.get_m_points()

      const hull = new Ammo.btConvexHullShape()
      hull.setMargin(options.margin)

      for (let pi = 0; pi < nPoints; pi++) {
        const btVertex = new Ammo.btVector3()
        const px = ch.get_m_points(pi * 3 + 0)
        const py = ch.get_m_points(pi * 3 + 1)
        const pz = ch.get_m_points(pi * 3 + 2)
        btVertex.setValue(px, py, pz)
        hull.addPoint(btVertex, pi === nPoints - 1)
        Ammo.destroy(btVertex)
      }

      _finishCollisionShape(hull, options, scale)
      shapes.push(hull)
    }
    Ammo.destroy(ch)
    Ammo.destroy(vhacd)

    return shapes
  }
})()

export const createTriMeshShape = (function () {
  const va = new Vector3()
  const vb = new Vector3()
  const vc = new Vector3()
  const matrix = new Matrix4()
  return function (vertices, matrices, indexes, matrixWorld, options = {}) {
    options.type = TYPE.MESH
    _setOptions(options)

    if (options.fit === FIT.MANUAL) {
      console.warn('cannot use fit: manual with type: mesh')
      return null
    }

    const scale = _computeScale(matrixWorld, options)

    const bta = new Ammo.btVector3()
    const btb = new Ammo.btVector3()
    const btc = new Ammo.btVector3()
    const triMesh = new Ammo.btTriangleMesh(true, false)

    for (let i = 0; i < vertices.length; i++) {
      const components = vertices[i]
      const index = indexes[i] ? indexes[i] : null
      matrix.fromArray(matrices[i])
      if (index) {
        for (let j = 0; j < index.length; j += 3) {
          const ai = index[j] * 3
          const bi = index[j + 1] * 3
          const ci = index[j + 2] * 3
          va.set(components[ai], components[ai + 1], components[ai + 2]).applyMatrix4(matrix)
          vb.set(components[bi], components[bi + 1], components[bi + 2]).applyMatrix4(matrix)
          vc.set(components[ci], components[ci + 1], components[ci + 2]).applyMatrix4(matrix)
          bta.setValue(va.x, va.y, va.z)
          btb.setValue(vb.x, vb.y, vb.z)
          btc.setValue(vc.x, vc.y, vc.z)
          triMesh.addTriangle(bta, btb, btc, false)
        }
      } else {
        for (let j = 0; j < components.length; j += 9) {
          va.set(components[j + 0], components[j + 1], components[j + 2]).applyMatrix4(matrix)
          vb.set(components[j + 3], components[j + 4], components[j + 5]).applyMatrix4(matrix)
          vc.set(components[j + 6], components[j + 7], components[j + 8]).applyMatrix4(matrix)
          bta.setValue(va.x, va.y, va.z)
          btb.setValue(vb.x, vb.y, vb.z)
          btc.setValue(vc.x, vc.y, vc.z)
          triMesh.addTriangle(bta, btb, btc, false)
        }
      }
    }

    const localScale = new Ammo.btVector3(scale.x, scale.y, scale.z)
    triMesh.setScaling(localScale)
    Ammo.destroy(localScale)

    // MOD (yandeu): Use btConvexTriangleMeshShape for concave shapes
    let collisionShape
    if (options.concave) collisionShape = new Ammo.btBvhTriangleMeshShape(triMesh, true, true)
    else collisionShape = new Ammo.btConvexTriangleMeshShape(triMesh, true)

    // const collisionShape = new Ammo.btBvhTriangleMeshShape(triMesh, true, true)

    collisionShape.resources = [triMesh]

    Ammo.destroy(bta)
    Ammo.destroy(btb)
    Ammo.destroy(btc)

    _finishCollisionShape(collisionShape, options)
    return collisionShape
  }
})()

export const createHeightfieldTerrainShape = function (options = {}) {
  _setOptions(options)

  if (options.fit === FIT.ALL) {
    console.warn('cannot use fit: all with type: heightfield')
    return null
  }
  const heightfieldDistance = options.heightfieldDistance || 1
  const heightfieldData = options.heightfieldData || []
  const heightScale = options.heightScale || 0
  const upAxis = options.hasOwnProperty('upAxis') ? options.upAxis : 1 // x = 0; y = 1; z = 2
  const hdt = (() => {
    switch (options.heightDataType) {
      case 'short':
        return Ammo.PHY_SHORT
      case 'float':
        return Ammo.PHY_FLOAT
      default:
        return Ammo.PHY_FLOAT
    }
  })()
  const flipQuadEdges = options.hasOwnProperty('flipQuadEdges') ? options.flipQuadEdges : true

  const heightStickLength = heightfieldData.length
  const heightStickWidth = heightStickLength > 0 ? heightfieldData[0].length : 0

  const data = Ammo._malloc(heightStickLength * heightStickWidth * 4)
  const ptr = data / 4

  let minHeight = Number.POSITIVE_INFINITY
  let maxHeight = Number.NEGATIVE_INFINITY
  let index = 0
  for (let l = 0; l < heightStickLength; l++) {
    for (let w = 0; w < heightStickWidth; w++) {
      const height = heightfieldData[l][w]
      Ammo.HEAPF32[ptr + index] = height
      index++
      minHeight = Math.min(minHeight, height)
      maxHeight = Math.max(maxHeight, height)
    }
  }

  const collisionShape = new Ammo.btHeightfieldTerrainShape(
    heightStickWidth,
    heightStickLength,
    data,
    heightScale,
    minHeight,
    maxHeight,
    upAxis,
    hdt,
    flipQuadEdges
  )

  const scale = new Ammo.btVector3(heightfieldDistance, 1, heightfieldDistance)
  collisionShape.setLocalScaling(scale)
  Ammo.destroy(scale)

  collisionShape.heightfieldData = data

  _finishCollisionShape(collisionShape, options)
  return collisionShape
}

function _setOptions(options) {
  // MOD (yandeu): All of this will be done in physics.ts
  // we only keep type and margin
  options.type = options.type || TYPE.HULL
  options.margin = options.hasOwnProperty('margin') ? options.margin : 0.01
  return

  options.fit = options.hasOwnProperty('fit') ? options.fit : FIT.ALL
  options.type = options.type || TYPE.HULL
  options.minHalfExtent = options.hasOwnProperty('minHalfExtent') ? options.minHalfExtent : 0
  options.maxHalfExtent = options.hasOwnProperty('maxHalfExtent') ? options.maxHalfExtent : Number.POSITIVE_INFINITY
  options.cylinderAxis = options.cylinderAxis || 'y'
  options.margin = options.hasOwnProperty('margin') ? options.margin : 0.01
  options.includeInvisible = options.hasOwnProperty('includeInvisible') ? options.includeInvisible : false

  if (!options.offset) {
    options.offset = new Vector3()
  }

  if (!options.orientation) {
    options.orientation = new Quaternion()
  }
}

const _finishCollisionShape = function (collisionShape, options, scale) {
  // MOD (yandeu): All of this will be done in physics.ts
  return

  collisionShape.type = options.type
  collisionShape.setMargin(options.margin)
  collisionShape.destroy = () => {
    for (let res of collisionShape.resources || []) {
      Ammo.destroy(res)
    }
    if (collisionShape.heightfieldData) {
      Ammo._free(collisionShape.heightfieldData)
    }
    Ammo.destroy(collisionShape)
  }

  const localTransform = new Ammo.btTransform()
  const rotation = new Ammo.btQuaternion()
  localTransform.setIdentity()

  localTransform.getOrigin().setValue(options.offset.x, options.offset.y, options.offset.z)
  rotation.setValue(options.orientation.x, options.orientation.y, options.orientation.z, options.orientation.w)

  localTransform.setRotation(rotation)
  Ammo.destroy(rotation)

  if (scale) {
    const localScale = new Ammo.btVector3(scale.x, scale.y, scale.z)
    collisionShape.setLocalScaling(localScale)
    Ammo.destroy(localScale)
  }

  collisionShape.localTransform = localTransform
}

export const iterateGeometries = (function () {
  const inverse = new Matrix4()
  return function (root, options, cb) {
    // MOD (yandeu): Update to three.js r123
    // compatibility fix for three.js >= r123 (Dezember 2020)
    if (parseInt(REVISION) >= 123) inverse.copy(root.matrixWorld).invert()
    else inverse.getInverse(root.matrixWorld)

    const scale = new Vector3()
    scale.setFromMatrixScale(root.matrixWorld)
    root.traverse(mesh => {
      const transform = new Matrix4()
      if (
        mesh.isMesh &&
        // MOD (yandeu): No need to check if name is 'Sky'
        // mesh.name !== 'Sky' &&
        (options.includeInvisible || (mesh.el && mesh.el.object3D.visible) || mesh.visible)
      ) {
        if (mesh === root) {
          transform.identity()
        } else {
          mesh.updateWorldMatrix(true)
          transform.multiplyMatrices(inverse, mesh.matrixWorld)
        }
        // todo: might want to return null xform if this is the root so that callers can avoid multiplying
        // things by the identity matrix
        cb(
          mesh.geometry.isBufferGeometry ? mesh.geometry.attributes.position.array : mesh.geometry.vertices,
          transform.elements,
          mesh.geometry.index ? mesh.geometry.index.array : null
        )
      }
    })
  }
})()

const _computeScale = (function () {
  const matrix = new Matrix4()
  return function (matrixWorld, options = {}) {
    const scale = new Vector3(1, 1, 1)
    if (options.fit === FIT.ALL) {
      matrix.fromArray(matrixWorld)
      scale.setFromMatrixScale(matrix)
    }
    return scale
  }
})()

const _computeRadius = (function () {
  const center = new Vector3()
  return function (vertices, matrices, bounds) {
    let maxRadiusSq = 0
    let { x: cx, y: cy, z: cz } = bounds.getCenter(center)

    _iterateVertices(vertices, matrices, v => {
      const dx = cx - v.x
      const dy = cy - v.y
      const dz = cz - v.z
      maxRadiusSq = Math.max(maxRadiusSq, dx * dx + dy * dy + dz * dz)
    })
    return Math.sqrt(maxRadiusSq)
  }
})()

const _computeHalfExtents = function (bounds, minHalfExtent, maxHalfExtent) {
  const halfExtents = new Vector3()
  return halfExtents.subVectors(bounds.max, bounds.min).multiplyScalar(0.5).clampScalar(minHalfExtent, maxHalfExtent)
}

const _computeLocalOffset = function (matrix, bounds, target) {
  target.addVectors(bounds.max, bounds.min).multiplyScalar(0.5).applyMatrix4(matrix)
  return target
}

// returns the bounding box for the geometries underneath `root`.
const _computeBounds = function (vertices, matrices) {
  const bounds = new Box3()
  let minX = +Infinity
  let minY = +Infinity
  let minZ = +Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let maxZ = -Infinity
  bounds.min.set(0, 0, 0)
  bounds.max.set(0, 0, 0)

  _iterateVertices(vertices, matrices, v => {
    if (v.x < minX) minX = v.x
    if (v.y < minY) minY = v.y
    if (v.z < minZ) minZ = v.z
    if (v.x > maxX) maxX = v.x
    if (v.y > maxY) maxY = v.y
    if (v.z > maxZ) maxZ = v.z
  })

  bounds.min.set(minX, minY, minZ)
  bounds.max.set(maxX, maxY, maxZ)
  return bounds
}

const _iterateVertices = (function () {
  const vertex = new Vector3()
  const matrix = new Matrix4()
  return function (vertices, matrices, cb) {
    for (let i = 0; i < vertices.length; i++) {
      matrix.fromArray(matrices[i])
      for (let j = 0; j < vertices[i].length; j += 3) {
        vertex.set(vertices[i][j], vertices[i][j + 1], vertices[i][j + 2]).applyMatrix4(matrix)
        cb(vertex)
      }
    }
  }
})()
