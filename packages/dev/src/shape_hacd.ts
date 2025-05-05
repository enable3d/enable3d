import { Matrix4, Vector3 } from 'three'

export const create_hacd_shape = (vertices: Array<number>, indexes: Array<number>) => {
  const vector = new Vector3()
  const center = new Vector3()
  const matrix = new Matrix4()

  const hacd = new Ammo.HACD()

  let vertexCount = vertices.length / 3
  let triCount = indexes.length / 3

  console.log(vertexCount, triCount)

  const points = Ammo._malloc(vertexCount * 3 * 8)
  const triangles = Ammo._malloc(triCount * 3 * 4)

  hacd.SetPoints(points)
  hacd.SetTriangles(triangles)
  hacd.SetNPoints(vertexCount)
  hacd.SetNTriangles(triCount)

  let pptr = points / 8,
    tptr = triangles / 4

  {
    matrix.fromArray(new Matrix4().scale(new Vector3(1, 1, 1)).toArray())
    for (let j = 0; j < vertices.length; j += 3) {
      vector
        .set(vertices[j], vertices[j + 1], vertices[j + 2])
        .applyMatrix4(matrix)
        .sub(center)
      Ammo.HEAPF64[pptr + 0] = vector.x
      Ammo.HEAPF64[pptr + 1] = vector.y
      Ammo.HEAPF64[pptr + 2] = vector.z
      pptr += 3
    }
    if (indexes) {
      const indices = indexes
      for (let j = 0; j < indices.length; j++) {
        Ammo.HEAP32[tptr] = indices[j]
        tptr++
      }
    } else {
      throw 'no indices'
      for (let j = 0; j < vertices.length; j++) {
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
    hull.setMargin(0.01)
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

    shapes.push(hull)
  }
  return shapes
}
