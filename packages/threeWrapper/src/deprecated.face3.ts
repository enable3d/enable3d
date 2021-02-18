// copied for three.js and ported to typescript

import { Color, Vector3 } from 'three'

export class Face3 {
  a: number
  b: number
  c: number
  normal: Vector3
  vertexNormals: any
  color: Color
  vertexColors: any
  materialIndex: number

  constructor(a: number, b: number, c: number, normal?: any, color?: Color, materialIndex = 0) {
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
    // @ts-ignore
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
