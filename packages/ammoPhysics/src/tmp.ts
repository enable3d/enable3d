import { BufferGeometry } from 'three'
import * as PKG from 'three/examples/jsm/utils/BufferGeometryUtils'
const { BufferGeometryUtils } = PKG

export interface TypeBufferGeometry extends BufferGeometry {
  index: any
  ammoVertices: number[]
  ammoIndices: number[]
  ammoIndexAssociation: any
}

export const isEqual = (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) => {
  const delta = 0.000001
  return Math.abs(x2 - x1) < delta && Math.abs(y2 - y1) < delta && Math.abs(z2 - z1) < delta
}

export const processGeometry = (bufGeometry: THREE.BufferGeometry) => {
  // Ony consider the position values when merging the vertices

  const posOnlyBufGeometry = new BufferGeometry()
  posOnlyBufGeometry.setAttribute('position', bufGeometry.getAttribute('position'))
  posOnlyBufGeometry.setIndex(bufGeometry.getIndex())

  // Merge the vertices so the triangle soup is converted to indexed triangles
  // @ts-ignore
  const indexedBufferGeom = BufferGeometryUtils.mergeVertices(posOnlyBufGeometry)

  // Create index arrays mapping the indexed vertices to bufGeometry vertices
  mapIndices(bufGeometry as any, indexedBufferGeom as any)
  // @ts-ignore
  // console.log('bufGeometry.ammoIndexAssociation', bufGeometry.ammoIndexAssociation)
}

const mapIndices = (bufGeometry: TypeBufferGeometry, indexedBufferGeom: TypeBufferGeometry) => {
  // Creates ammoVertices, ammoIndices and ammoIndexAssociation in bufGeometry

  const vertices = bufGeometry.attributes.position.array
  const idxVertices = indexedBufferGeom.attributes.position.array as any
  const indices = indexedBufferGeom.index.array

  const numIdxVertices = idxVertices.length / 3
  const numVertices = vertices.length / 3

  bufGeometry.ammoVertices = idxVertices
  bufGeometry.ammoIndices = indices
  bufGeometry.ammoIndexAssociation = []

  console.log('numIdxVertices', numIdxVertices)
  console.log('numVertices', numVertices)

  for (let i = 0; i < numIdxVertices; i++) {
    const association: any = []
    bufGeometry.ammoIndexAssociation.push(association)

    const i3 = i * 3

    for (let j = 0; j < numVertices; j++) {
      const j3 = j * 3
      if (
        isEqual(
          idxVertices[i3],
          idxVertices[i3 + 1],
          idxVertices[i3 + 2],
          vertices[j3],
          vertices[j3 + 1],
          vertices[j3 + 2]
        )
      ) {
        association.push(j3)
      }
    }
  }

  // console.log('bufGeometry.ammoIndexAssociation', bufGeometry.ammoIndexAssociation)
}
