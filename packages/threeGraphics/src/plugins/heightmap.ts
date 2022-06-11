/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2022 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { DoubleSide, MeshPhongMaterial, MeshPhongMaterialParameters, PlaneBufferGeometry, Scene, Texture } from 'three'
import { ExtendedMesh } from '@enable3d/common/dist/extendedMesh'
import { HeightMapConfig } from '@enable3d/common/dist/types'

export default class HeightMap {
  constructor(private scene: Scene) {}

  public add(texture: Texture, config: HeightMapConfig = {}) {
    const heightMap = this.make(texture, config)

    if (heightMap) this.scene.add(heightMap)
    else console.warn('Could not make heightmap')

    return heightMap
  }

  public make(texture: Texture, config: HeightMapConfig = {}) {
    const { image } = texture
    const { width, height } = image
    const { colorScale } = config

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    ctx.drawImage(texture.image, 0, 0)
    const pixel = ctx.getImageData(0, 0, width, height)

    const geometry = new PlaneBufferGeometry(10, 10, width - 1, height - 1)

    // material
    let materialConfig: MeshPhongMaterialParameters = { color: 0xcccccc, side: DoubleSide }
    if (colorScale) materialConfig = { ...materialConfig, vertexColors: true }
    const material = new MeshPhongMaterial(materialConfig)

    // mesh
    const mesh = new ExtendedMesh(geometry, material)
    mesh.receiveShadow = mesh.castShadow = true
    mesh.shape = 'concave'

    // adjust all z values
    const vertices = geometry.attributes.position.array
    for (let i = 0; i < vertices.length; i++) {
      const height = pixel.data[i * 4] / 120
      // @ts-expect-error
      vertices[i * 3 + 2] = height
    }

    // helper function to get the highest point
    // const getHighPoint = (geometry: Geometry, face: Face3) => {
    //   var v1 = geometry.vertices[face.a].z
    //   var v2 = geometry.vertices[face.b].z
    //   var v3 = geometry.vertices[face.c].z

    //   return Math.max(v1, v2, v3)
    // }

    // apply color scale if available
    // if (colorScale) geo.faces.forEach(face => (face.color = new Color(colorScale(getHighPoint(geo, face)).hex())))

    mesh.rotateX(-Math.PI / 2)
    mesh.updateMatrix()

    geometry.computeVertexNormals()

    mesh.name = 'heightmap'

    return mesh as ExtendedMesh
  }
}
