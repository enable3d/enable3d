// copied from https://github.com/mrdoob/three.js/blob/670b1e9e85356d98efa4c702e93c85dd52f01e1e/src/core/DirectGeometry.js

import { Vector2 } from '@enable3d/three-wrapper/dist/index'

export class DirectGeometry {
  vertices: any[] = []
  normals: any[] = []
  colors: any[] = []
  uvs: any[] = []
  uvs2: any[] = []

  groups = []

  morphTargets: any = {}

  skinWeights = []
  skinIndices = []

  // lineDistances = [];

  boundingBox = null
  boundingSphere = null

  // update flags

  verticesNeedUpdate = false
  normalsNeedUpdate = false
  colorsNeedUpdate = false
  uvsNeedUpdate = false
  groupsNeedUpdate = false

  constructor() {}

  computeGroups(geometry: any) {
    const groups: any = []

    let group: any, i
    let materialIndex = undefined

    const faces = geometry.faces

    for (i = 0; i < faces.length; i++) {
      const face = faces[i]

      // materials

      if (face.materialIndex !== materialIndex) {
        materialIndex = face.materialIndex

        if (group !== undefined) {
          group.count = i * 3 - group.start
          groups.push(group)
        }

        group = {
          start: i * 3,
          materialIndex: materialIndex
        }
      }
    }

    if (group !== undefined) {
      group.count = i * 3 - group.start
      groups.push(group)
    }

    this.groups = groups
  }

  fromGeometry(geometry: any) {
    const faces: any[] = geometry.faces
    const vertices: any[] = geometry.vertices
    const faceVertexUvs: any[] = geometry.faceVertexUvs

    const hasFaceVertexUv = faceVertexUvs[0] && faceVertexUvs[0].length > 0
    const hasFaceVertexUv2 = faceVertexUvs[1] && faceVertexUvs[1].length > 0

    // morphs

    const morphTargets = geometry.morphTargets
    const morphTargetsLength = morphTargets.length

    let morphTargetsPosition: any

    if (morphTargetsLength > 0) {
      morphTargetsPosition = []

      for (let i = 0; i < morphTargetsLength; i++) {
        morphTargetsPosition[i] = {
          name: morphTargets[i].name,
          data: []
        }
      }

      this.morphTargets.position = morphTargetsPosition
    }

    const morphNormals = geometry.morphNormals
    const morphNormalsLength = morphNormals.length

    let morphTargetsNormal: any

    if (morphNormalsLength > 0) {
      morphTargetsNormal = []

      for (let i = 0; i < morphNormalsLength; i++) {
        morphTargetsNormal[i] = {
          name: morphNormals[i].name,
          data: []
        }
      }

      this.morphTargets.normal = morphTargetsNormal
    }

    // skins

    const skinIndices: any[] = geometry.skinIndices
    const skinWeights: any[] = geometry.skinWeights

    const hasSkinIndices: any = skinIndices.length === vertices.length
    const hasSkinWeights: any = skinWeights.length === vertices.length

    //

    if (vertices.length > 0 && faces.length === 0) {
      console.error('THREE.DirectGeometry: Faceless geometries are not supported.')
    }

    for (let i = 0; i < faces.length; i++) {
      const face = faces[i]

      this.vertices.push(vertices[face.a], vertices[face.b], vertices[face.c])

      const vertexNormals = face.vertexNormals

      if (vertexNormals.length === 3) {
        this.normals.push(vertexNormals[0], vertexNormals[1], vertexNormals[2])
      } else {
        const normal = face.normal

        this.normals.push(normal, normal, normal)
      }

      const vertexColors = face.vertexColors

      if (vertexColors.length === 3) {
        this.colors.push(vertexColors[0], vertexColors[1], vertexColors[2])
      } else {
        const color = face.color

        this.colors.push(color, color, color)
      }

      if (hasFaceVertexUv === true) {
        const vertexUvs = faceVertexUvs[0][i]

        if (vertexUvs !== undefined) {
          this.uvs.push(vertexUvs[0], vertexUvs[1], vertexUvs[2])
        } else {
          console.warn('THREE.DirectGeometry.fromGeometry(): Undefined vertexUv ', i)

          this.uvs.push(new Vector2(), new Vector2(), new Vector2())
        }
      }

      if (hasFaceVertexUv2 === true) {
        const vertexUvs = faceVertexUvs[1][i]

        if (vertexUvs !== undefined) {
          this.uvs2.push(vertexUvs[0], vertexUvs[1], vertexUvs[2])
        } else {
          console.warn('THREE.DirectGeometry.fromGeometry(): Undefined vertexUv2 ', i)

          this.uvs2.push(new Vector2(), new Vector2(), new Vector2())
        }
      }

      // morphs

      for (let j = 0; j < morphTargetsLength; j++) {
        const morphTarget = morphTargets[j].vertices

        morphTargetsPosition[j].data.push(morphTarget[face.a], morphTarget[face.b], morphTarget[face.c])
      }

      for (let j = 0; j < morphNormalsLength; j++) {
        const morphNormal = morphNormals[j].vertexNormals[i]

        morphTargetsNormal[j].data.push(morphNormal.a, morphNormal.b, morphNormal.c)
      }

      // skins

      if (hasSkinIndices) {
        // @ts-expect-error
        this.skinIndices.push(skinIndices[face.a], skinIndices[face.b], skinIndices[face.c])
      }

      if (hasSkinWeights) {
        // @ts-expect-error
        this.skinWeights.push(skinWeights[face.a], skinWeights[face.b], skinWeights[face.c])
      }
    }

    this.computeGroups(geometry)

    this.verticesNeedUpdate = geometry.verticesNeedUpdate
    this.normalsNeedUpdate = geometry.normalsNeedUpdate
    this.colorsNeedUpdate = geometry.colorsNeedUpdate
    this.uvsNeedUpdate = geometry.uvsNeedUpdate
    this.groupsNeedUpdate = geometry.groupsNeedUpdate

    if (geometry.boundingSphere !== null) {
      this.boundingSphere = geometry.boundingSphere.clone()
    }

    if (geometry.boundingBox !== null) {
      this.boundingBox = geometry.boundingBox.clone()
    }

    return this
  }
}
