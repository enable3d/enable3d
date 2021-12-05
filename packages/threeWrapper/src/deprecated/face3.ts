import { Color, Vector3 } from 'three'

class Face3 {
  a: any
  b: any
  c: any

  normal: any
  vertexNormals: any

  color: any
  vertexColors: any

  materialIndex: any

  constructor(a: any, b: any, c: any, normal?: any, color?: any, materialIndex = 0) {
    this.a = a
    this.b = b
    this.c = c

    this.normal = normal && normal.isVector3 ? normal : new Vector3()
    this.vertexNormals = Array.isArray(normal) ? normal : []

    this.color = color && color.isColor ? color : new Color()
    this.vertexColors = Array.isArray(color) ? color : []

    this.materialIndex = materialIndex
  }

  clone() {
    // @ts-expect-error
    return new this.constructor().copy(this)
  }

  copy(source: any) {
    this.a = source.a
    this.b = source.b
    this.c = source.c

    this.normal.copy(source.normal)
    this.color.copy(source.color)

    this.materialIndex = source.materialIndex

    for (let i = 0, il = source.vertexNormals.length; i < il; i++) {
      this.vertexNormals[i] = source.vertexNormals[i].clone()
    }

    for (let i = 0, il = source.vertexColors.length; i < il; i++) {
      this.vertexColors[i] = source.vertexColors[i].clone()
    }

    return this
  }
}

export { Face3 }
