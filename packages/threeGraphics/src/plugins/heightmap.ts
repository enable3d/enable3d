/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2022 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|LGPL-3.0}
 */

import {
  BufferAttribute,
  Color,
  DoubleSide,
  MeshPhongMaterial,
  MeshPhongMaterialParameters,
  PlaneGeometry,
  Scene,
  Texture
} from 'three'
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
    const { colorScale, heightScale = 100 } = config

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    ctx.drawImage(texture.image, 0, 0)
    const pixel = ctx.getImageData(0, 0, width, height)

    const geometry = new PlaneGeometry(10, 10, width - 1, height - 1)

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
      const height = pixel.data[i * 4] / heightScale
      // @ts-expect-error
      vertices[i * 3 + 2] = height
    }

    if (colorScale) {
      const count = geometry.attributes.position.count
      geometry.setAttribute('color', new BufferAttribute(new Float32Array(count * 3), 3))
      const color = new Color()
      const positions = geometry.attributes.position
      const colors = geometry.attributes.color
      let z
      let hsl

      for (let i = 0; i < count; i++) {
        z = positions.getZ(i)
        hsl = colorScale(z).hsl()
        color.setHSL(hsl[0] / 360, hsl[1], hsl[2], hsl[3])
        colors.setXYZ(i, color.r, color.g, color.b)
      }
    }

    mesh.rotateX(-Math.PI / 2)
    mesh.updateMatrix()

    geometry.computeVertexNormals()

    mesh.name = 'heightmap'

    return mesh as ExtendedMesh
  }
}
