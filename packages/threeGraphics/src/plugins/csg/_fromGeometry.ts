// copied from https://github.com/mrdoob/three.js/blob/670b1e9e85356d98efa4c702e93c85dd52f01e1e/src/core/BufferGeometry.js

import { BufferGeometry, Geometry, BufferAttribute, Float32BufferAttribute } from '@enable3d/three-wrapper/dist/index'
import { DirectGeometry } from './_directGeometry'

export const fromGeometry = (buffer: BufferGeometry, geometry: Geometry) => {
  const directGeometry = new DirectGeometry().fromGeometry(geometry)

  return fromDirectGeometry(buffer, directGeometry)
}

const fromDirectGeometry = (buffer: BufferGeometry, geometry: DirectGeometry) => {
  const positions = new Float32Array(geometry.vertices.length * 3)
  buffer.setAttribute('position', new BufferAttribute(positions, 3).copyVector3sArray(geometry.vertices))

  if (geometry.normals.length > 0) {
    const normals = new Float32Array(geometry.normals.length * 3)
    buffer.setAttribute('normal', new BufferAttribute(normals, 3).copyVector3sArray(geometry.normals))
  }

  if (geometry.colors.length > 0) {
    const colors = new Float32Array(geometry.colors.length * 3)
    buffer.setAttribute('color', new BufferAttribute(colors, 3).copyColorsArray(geometry.colors))
  }

  if (geometry.uvs.length > 0) {
    const uvs = new Float32Array(geometry.uvs.length * 2)
    buffer.setAttribute('uv', new BufferAttribute(uvs, 2).copyVector2sArray(geometry.uvs))
  }

  if (geometry.uvs2.length > 0) {
    const uvs2 = new Float32Array(geometry.uvs2.length * 2)
    buffer.setAttribute('uv2', new BufferAttribute(uvs2, 2).copyVector2sArray(geometry.uvs2))
  }

  // groups

  buffer.groups = geometry.groups

  // morphs

  for (const name in geometry.morphTargets) {
    const array = []
    const morphTargets = geometry.morphTargets[name]

    for (let i = 0, l = morphTargets.length; i < l; i++) {
      const morphTarget = morphTargets[i]

      const attribute = new Float32BufferAttribute(morphTarget.data.length * 3, 3)
      attribute.name = morphTarget.name

      array.push(attribute.copyVector3sArray(morphTarget.data))
    }

    buffer.morphAttributes[name] = array
  }

  // skinning

  if (geometry.skinIndices.length > 0) {
    const skinIndices = new Float32BufferAttribute(geometry.skinIndices.length * 4, 4)
    buffer.setAttribute('skinIndex', skinIndices.copyVector4sArray(geometry.skinIndices))
  }

  if (geometry.skinWeights.length > 0) {
    const skinWeights = new Float32BufferAttribute(geometry.skinWeights.length * 4, 4)
    buffer.setAttribute('skinWeight', skinWeights.copyVector4sArray(geometry.skinWeights))
  }

  //

  if (geometry.boundingSphere !== null) {
    // @ts-expect-error
    buffer.boundingSphere = geometry.boundingSphere?.clone()
  }

  if (geometry.boundingBox !== null) {
    // @ts-expect-error
    buffer.boundingBox = geometry.boundingBox?.clone()
  }

  return buffer
}
