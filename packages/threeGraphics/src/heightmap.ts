/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import {
  Scene,
  PlaneGeometry,
  MeshPhongMaterial,
  Mesh,
  Geometry,
  DoubleSide,
  FaceColors,
  Face3,
  Color,
  Texture
} from '@enable3d/three-wrapper/dist/index'
import { ExtendedObject3D, HeightMapConfig } from '@enable3d/common/dist/types'
import logger from '@enable3d/common/dist/logger'

export default class HeightMap {
  public scene: Scene

  constructor() {}

  protected addHeightMap(texture: Texture, config: HeightMapConfig = {}) {
    const heightMap = this.makeHeightMap(texture, config)
    if (heightMap) this.scene.add(heightMap)
    else logger('Could not make heightmap')
    return heightMap
  }

  protected makeHeightMap(texture: Texture, config: HeightMapConfig = {}) {
    // var spacingX = 3
    // var spacingZ = 3
    // var heightOffset = 2

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

    // geometry
    const plane = new PlaneGeometry(10, 10, width - 1, height - 1)

    // material
    let materialConfig: any = { color: 0xcccccc, side: DoubleSide }
    if (colorScale) materialConfig = { ...materialConfig, vertexColors: FaceColors }
    const material = new MeshPhongMaterial(materialConfig)

    // mesh
    const mesh = new Mesh(plane, material) as ExtendedObject3D
    mesh.receiveShadow = mesh.castShadow = true
    mesh.shape = 'concave'

    // adjust all z values
    const geo = mesh.geometry as Geometry
    for (let i = 0; i < geo.vertices.length; i++) {
      geo.vertices[i].z = pixel.data[i * 4] / 120
    }

    // helper function to get the highest point
    const getHighPoint = (geometry: Geometry, face: Face3) => {
      var v1 = geometry.vertices[face.a].z
      var v2 = geometry.vertices[face.b].z
      var v3 = geometry.vertices[face.c].z

      return Math.max(v1, v2, v3)
    }

    // apply color scale if available
    if (colorScale) geo.faces.forEach(face => (face.color = new Color(colorScale(getHighPoint(geo, face)).hex())))

    mesh.rotateX(-Math.PI / 2)
    mesh.updateMatrix()

    plane.computeFaceNormals()
    plane.computeVertexNormals()

    mesh.name = 'heightmap'

    return mesh
  }
}
