/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

// Originally copied from https://github.com/Hi-Level/three-csg
// which is a typescript rewrite of https://github.com/manthrax/THREE-CSGMesh
// which as originally written by Copyright (c) 2011 Evan Wallace (http://madebyevan.com/), under the MIT license.

import { Vector3, Geometry, Matrix3, Face3, Mesh, Matrix4, Scene, REVISION } from '@enable3d/three-wrapper/dist/index'
import Transform from './transform'

/**
 * CSG wrapper for enable3d
 *
 * The CSG library does not support buffer geometries.
 * Means we first make sure we are dealing with geometries
 * and then transform them back to buffer geometries.
 */
export default class CSGWrapper {
  constructor(private scene: Scene, private transform: Transform) {}

  private toGeometry(meshA: Mesh, meshB: Mesh) {
    // @ts-ignore
    meshA.geometry = this.transform.bufferGeometryToGeometry(meshA.geometry)
    // @ts-ignore
    meshB.geometry = this.transform.bufferGeometryToGeometry(meshB.geometry)
  }

  private toBufferGeometry(meshC: Mesh) {
    // @ts-ignore
    meshC.geometry = this.transform.geometryToBufferGeometry(meshC.geometry)
  }

  public union(meshA: Mesh, meshB: Mesh): Mesh {
    this.toGeometry(meshA, meshB)

    const meshC = this.doCSG(meshA, meshB, 'union')
    this.toBufferGeometry(meshC)

    return meshC
  }

  public subtract(meshA: Mesh, meshB: Mesh): Mesh {
    this.toGeometry(meshA, meshB)

    const meshC = this.doCSG(meshA, meshB, 'subtract')
    this.toBufferGeometry(meshC)

    return meshC
  }

  public intersect(meshA: any, meshB: any): Mesh {
    this.toGeometry(meshA, meshB)

    const meshC = this.doCSG(meshA, meshB, 'intersect')
    this.toBufferGeometry(meshC)

    return meshC
  }

  private doCSG(meshA: any, meshB: any, operation: 'union' | 'subtract' | 'intersect'): Mesh {
    meshA.updateMatrix()
    meshB.updateMatrix()
    const bspA = CSG.fromMesh(meshA)
    const bspB = CSG.fromMesh(meshB)
    // @ts-ignore
    const bspC = bspA[operation](bspB)
    const result = CSG.toMesh(bspC, meshA.matrix)
    return result
  }
}

/**
 * CSG (Constructive Solid Geometry) library for three.js with Typescript support.
 * Holds a binary space partition tree representing a 3D solid. Two solids can
 * be combined using the `union()`, `subtract()`, and `intersect()` methods.
 */
class CSG {
  static fromPolygons(polygons: Polygon[]) {
    const csg = new CSG()
    csg.polygons = polygons
    return csg
  }

  static fromGeometry(geom: any) {
    if (geom.isBufferGeometry) {
      geom = new Geometry().fromBufferGeometry(geom)
    }
    const fs = geom.faces
    const vs = geom.vertices
    const polys = []
    const fm = ['a', 'b', 'c']
    for (let i = 0; i < fs.length; i++) {
      const f = fs[i]
      const vertices = []
      for (let j = 0; j < 3; j++) {
        const uvs =
          geom.faceVertexUvs[0][i] !== undefined && geom.faceVertexUvs[0][i][j] !== undefined
            ? geom.faceVertexUvs[0][i][j]
            : undefined
        vertices.push(new Vertex(vs[f[fm[j]]], f.vertexNormals[j], uvs))
      }

      polys.push(new Polygon(vertices))
    }
    return CSG.fromPolygons(polys)
  }

  static fromMesh(mesh: Mesh) {
    const csg = CSG.fromGeometry(mesh.geometry)
    CSG._tmpm3.getNormalMatrix(mesh.matrix)
    for (const p of csg.polygons) {
      for (const v of p.vertices) {
        v.pos.applyMatrix4(mesh.matrix)
        v.normal.applyMatrix3(CSG._tmpm3)
      }
    }
    return csg
  }

  static toMesh(csg: CSG, toMatrix: Matrix4) {
    const geom = new Geometry()
    const ps = csg.polygons
    const vs = geom.vertices
    const fvuv = geom.faceVertexUvs[0]
    for (const p of ps) {
      const pvs = p.vertices
      const v0 = vs.length
      const pvlen = pvs.length

      for (const pv of pvs) {
        vs.push(new Vector3().copy(pv.pos))
      }

      for (let j = 3; j <= pvlen; j++) {
        const fc = new Face3(v0, v0 + j - 2, v0 + j - 1)
        const fuv: any[] = []
        fvuv.push(fuv)
        const fnml = fc.vertexNormals

        fnml.push(new Vector3().copy(pvs[0].normal))
        fnml.push(new Vector3().copy(pvs[j - 2].normal))
        fnml.push(new Vector3().copy(pvs[j - 1].normal))
        // check for uv property
        if (pvs[0].uv && pvs[j - 2].uv && pvs[j - 1].uv) {
          fuv.push(new Vector3().copy(pvs[0].uv))
          fuv.push(new Vector3().copy(pvs[j - 2].uv))
          fuv.push(new Vector3().copy(pvs[j - 1].uv))
        }

        fc.normal = new Vector3().copy(p.plane.normal)
        geom.faces.push(fc)
      }
    }
    // compatibility fix for three.js >= r123 (Dezember 2020)
    const inv =
      +REVISION >= 123 ? new Matrix4().copy(toMatrix).invert() : (new Matrix4().getInverse(toMatrix) as Matrix4)
    geom.applyMatrix4(inv)
    geom.verticesNeedUpdate = geom.elementsNeedUpdate = geom.normalsNeedUpdate = true
    geom.computeBoundingSphere()
    geom.computeBoundingBox()
    const m = new Mesh(geom)
    m.matrix.copy(toMatrix)
    m.matrix.decompose(m.position, m.rotation as any, m.scale)
    m.updateMatrixWorld()
    return m
  }

  static iEval(tokens: Mesh, _index = 0) {
    if (typeof tokens === 'string') {
      CSG.currentOp = tokens
    } else if (tokens instanceof Array) {
      for (const token of tokens) {
        CSG.iEval(token, 0)
      }
    } else if (typeof tokens === 'object') {
      const op = CSG.currentOp
      tokens.updateMatrix()
      tokens.updateMatrixWorld()
      if (!CSG.sourceMesh) {
        CSG.currentPrim = CSG.fromMesh((CSG.sourceMesh = tokens))
      } else {
        CSG.nextPrim = CSG.fromMesh(tokens)
        CSG.currentPrim = CSG.currentPrim[op](CSG.nextPrim)
      }
      if (CSG.doRemove) tokens?.parent?.remove(tokens)
    } // union,subtract,intersect,inverse
  }

  static eval(tokens: Mesh, doRemove: boolean) {
    // [['add',mesh,mesh,mesh,mesh],['sub',mesh,mesh,mesh,mesh]]
    delete CSG.currentOp
    delete CSG.sourceMesh
    CSG.doRemove = doRemove
    CSG.iEval(tokens)
    const result = CSG.toMesh(CSG.currentPrim, CSG.sourceMesh.matrix)
    result.material = CSG.sourceMesh.material
    result.castShadow = result.receiveShadow = true
    return result
  }

  private static _tmpm3 = new Matrix3()
  private static doRemove: boolean
  private static currentOp: string
  private static currentPrim: any
  private static nextPrim: CSG
  private static sourceMesh: Mesh
  private polygons: Polygon[]

  constructor() {
    this.polygons = []
  }

  clone() {
    const csg = new CSG()
    csg.polygons = this.polygons.map(p => {
      return p.clone()
    })
    return csg
  }

  toPolygons() {
    return this.polygons
  }

  union(csg: CSG) {
    const a = new Node(this.clone().polygons)
    const b = new Node(csg.clone().polygons)
    a.clipTo(b)
    b.clipTo(a)
    b.invert()
    b.clipTo(a)
    b.invert()
    a.build(b.allPolygons())
    return CSG.fromPolygons(a.allPolygons())
  }

  subtract(csg: CSG) {
    const a = new Node(this.clone().polygons)
    const b = new Node(csg.clone().polygons)
    a.invert()
    a.clipTo(b)
    b.clipTo(a)
    b.invert()
    b.clipTo(a)
    b.invert()
    a.build(b.allPolygons())
    a.invert()
    return CSG.fromPolygons(a.allPolygons())
  }

  intersect(csg: CSG) {
    const a = new Node(this.clone().polygons)
    const b = new Node(csg.clone().polygons)
    a.invert()
    b.clipTo(a)
    b.invert()
    a.clipTo(b)
    b.clipTo(a)
    a.build(b.allPolygons())
    a.invert()
    return CSG.fromPolygons(a.allPolygons())
  }

  inverse() {
    const csg = this.clone()
    csg.polygons.map(p => {
      p.flip()
    })
    return csg
  }
}

/**
 * Represents a 3D vector.
 */
class Vector extends Vector3 {
  constructor(x: number, y: number, z: number) {
    if (arguments.length === 3) {
      super(x, y, z)
    } else if (Array.isArray(x)) {
      super(x[0], x[1], x[2])
    } else if (typeof x === 'object') {
      this.copy(x)
    } else {
      throw new Error('Invalid constructor to vector')
    }
  }

  clone(): any {
    return new Vector(this.x, this.y, this.z)
  }
  negated(): Vector {
    return this.clone().multiplyScalar(-1)
  }
  plus(a: Vector): Vector {
    return this.clone().add(a)
  }
  minus(a: Vector): Vector {
    return this.clone().sub(a)
  }
  times(a: number): Vector {
    return this.clone().multiplyScalar(a)
  }
  dividedBy(a: number): Vector {
    return this.clone().divideScalar(a)
  }
  lerp(a: Vector, t: number): any {
    return this.plus(a.minus(this).times(t))
  }
  unit(): Vector {
    return this.dividedBy(this.length())
  }
  // @ts-ignore
  cross(a: Vector3, w?: Vector3) {
    return Vector3.prototype.cross.call(this.clone(), a)
  }
}

interface IVector {
  x: number
  y: number
  z: number
}

/**
 * Represents a vertex of a polygon. Use your own vertex class instead of this
 * one to provide additional features like texture coordinates and vertex
 * colors. Custom vertex classes need to provide a `pos` property and `clone()`,
 * `flip()`, and `interpolate()` methods that behave analogous to the ones
 * defined by `CSG.Vertex`. This class provides `normal` so convenience
 * functions like `CSG.sphere()` can return a smooth vertex normal, but `normal`
 * is not used anywhere else.
 */
class Vertex {
  pos: Vector
  normal: Vector
  uv: Vector

  constructor(pos: IVector, normal: IVector, uv?: IVector) {
    this.pos = new Vector(pos.x, pos.y, pos.z)
    this.normal = new Vector(normal.x, normal.y, normal.z)
    if (uv) this.uv = new Vector(uv.x, uv.y, uv.z)
  }

  clone() {
    return new Vertex(this.pos.clone(), this.normal.clone(), this.uv ? this.uv.clone() : undefined)
  }

  // Invert all orientation-specific data (e.g. vertex normal). Called when the
  // orientation of a polygon is flipped.
  flip() {
    this.normal = this.normal.negated()
  }

  // Create a new vertex between this vertex and `other` by linearly
  // interpolating all properties using a parameter of `t`. Subclasses should
  // override this to interpolate additional properties.
  interpolate(other: Vertex, t: number) {
    return new Vertex(
      this.pos.lerp(other.pos, t),
      this.normal.lerp(other.normal, t),
      this.uv ? this.uv.lerp(other.uv, t) : undefined
    )
  }
}

/**
 * Represents a plane in 3D space.
 */
class Plane {
  static fromPoints(a: Vector, b: Vector, c: Vector) {
    const n = b
      .minus(a)
      .cross(c.minus(a))
      // @ts-ignore
      .unit()
    return new Plane(n, n.dot(a))
  }

  // the tolerance used by `splitPolygon()` to decide if a
  // point is on the plane.
  private static EPSILON = 1e-5
  normal: Vector
  w: number

  constructor(normal: Vector, w: number) {
    this.normal = normal
    this.w = w
  }

  clone() {
    return new Plane(this.normal.clone(), this.w)
  }

  flip() {
    this.normal = this.normal.negated()
    this.w = -this.w
  }

  // Split `polygon` by this plane if needed, then put the polygon or polygon
  // fragments in the appropriate lists. Coplanar polygons go into either
  // `coplanarFront` or `coplanarBack` depending on their orientation with
  // respect to this plane. Polygons in front or in back of this plane go into
  // either `front` or `back`.
  splitPolygon(polygon: Polygon, coplanarFront: Polygon[], coplanarBack: Polygon[], front: Polygon[], back: Polygon[]) {
    const COPLANAR = 0
    const FRONT = 1
    const BACK = 2
    const SPANNING = 3

    // Classify each point as well as the entire polygon into one of the above
    // four classes.
    let polygonType = 0
    const types = []
    for (const vertex of polygon.vertices) {
      const t = this.normal.dot(vertex.pos) - this.w
      const type = t < -Plane.EPSILON ? BACK : t > Plane.EPSILON ? FRONT : COPLANAR
      polygonType |= type
      types.push(type)
    }

    // Put the polygon in the correct list, splitting it when necessary.
    switch (polygonType) {
      case COPLANAR:
        ;(this.normal.dot(polygon.plane.normal) > 0 ? coplanarFront : coplanarBack).push(polygon)
        break
      case FRONT:
        front.push(polygon)
        break
      case BACK:
        back.push(polygon)
        break
      case SPANNING:
        const f = []
        const b = []
        for (let i = 0; i < polygon.vertices.length; i++) {
          const j = (i + 1) % polygon.vertices.length
          const ti = types[i]
          const tj = types[j]
          const vi = polygon.vertices[i]
          const vj = polygon.vertices[j]
          if (ti !== BACK) {
            f.push(vi)
          }
          if (ti !== FRONT) {
            b.push(ti !== BACK ? vi.clone() : vi)
          }
          if ((ti | tj) === SPANNING) {
            const t = (this.w - this.normal.dot(vi.pos)) / this.normal.dot(vj.pos.minus(vi.pos))
            const v = vi.interpolate(vj, t)
            f.push(v)
            b.push(v.clone())
          }
        }
        if (f.length >= 3) {
          front.push(new Polygon(f, polygon.shared))
        }
        if (b.length >= 3) {
          back.push(new Polygon(b, polygon.shared))
        }
        break
    }
  }
}

/**
 * Represents a convex polygon. The vertices used to initialize a polygon must
 * be coplanar and form a convex loop. They do not have to be `Vertex`
 * instances but they must behave similarly (duck typing can be used for
 * customization).
 *
 * Each convex polygon has a `shared` property, which is shared between all
 * polygons that are clones of each other or were split from the same polygon.
 * This can be used to define per-polygon properties (such as surface color).
 */
class Polygon {
  plane: Plane
  vertices: Vertex[]
  shared: any

  constructor(vertices: Vertex[], shared: any = null) {
    this.vertices = vertices
    this.shared = shared
    this.plane = Plane.fromPoints(vertices[0].pos, vertices[1].pos, vertices[2].pos)
  }

  clone() {
    const vertices = this.vertices.map(v => {
      return v.clone()
    })
    return new Polygon(vertices, this.shared)
  }
  flip() {
    this.vertices.reverse().map(v => {
      v.flip()
    })
    this.plane.flip()
  }
}

/**
 * Holds a node in a BSP tree. A BSP tree is built from a collection of polygons
 * by picking a polygon to split along. That polygon (and all other coplanar
 * polygons) are added directly to that node and the other polygons are added to
 * the front and/or back subtrees. This is not a leafy BSP tree since there is
 * no distinction between internal and leaf nodes.
 */
class Node {
  private polygons: Polygon[]
  private plane: Plane
  private front: Node
  private back: Node

  constructor(polygons?: Polygon[]) {
    delete this.plane
    delete this.front
    delete this.back
    this.polygons = []
    if (polygons) {
      this.build(polygons)
    }
  }
  clone() {
    const node = new Node()
    node.plane = this.plane && this.plane.clone()
    node.front = this.front && this.front.clone()
    node.back = this.back && this.back.clone()
    node.polygons = this.polygons.map(p => {
      return p.clone()
    })
    return node
  }

  // Convert solid space to empty space and empty space to solid space.
  invert() {
    for (const polygon of this.polygons) {
      polygon.flip()
    }

    this.plane.flip()
    if (this.front) {
      this.front.invert()
    }
    if (this.back) {
      this.back.invert()
    }
    const temp = this.front
    this.front = this.back
    this.back = temp
  }

  // Recursively remove all polygons in `polygons` that are inside this BSP
  // tree.
  clipPolygons(polygons: Polygon[]) {
    if (!this.plane) {
      return polygons.slice()
    }
    let front: Polygon[] = []
    let back: Polygon[] = []
    for (const polygon of polygons) {
      this.plane.splitPolygon(polygon, front, back, front, back)
    }
    if (this.front) {
      front = this.front.clipPolygons(front)
    }
    back = this.back ? this.back.clipPolygons(back) : []
    return front.concat(back)
  }

  // Remove all polygons in this BSP tree that are inside the other BSP tree
  // `bsp`.
  clipTo(bsp: Node) {
    this.polygons = bsp.clipPolygons(this.polygons)
    if (this.front) {
      this.front.clipTo(bsp)
    }
    if (this.back) {
      this.back.clipTo(bsp)
    }
  }

  // Return a list of all polygons in this BSP tree.
  allPolygons() {
    let polygons = this.polygons.slice()
    if (this.front) {
      polygons = polygons.concat(this.front.allPolygons())
    }
    if (this.back) {
      polygons = polygons.concat(this.back.allPolygons())
    }
    return polygons
  }

  // Build a BSP tree out of `polygons`. When called on an existing tree, the
  // new polygons are filtered down to the bottom of the tree and become new
  // nodes there. Each set of polygons is partitioned using the first polygon
  // (no heuristic is used to pick a good split).
  build(polygons: Polygon[]) {
    if (!polygons.length) {
      return
    }
    if (!this.plane) {
      this.plane = polygons[0].plane.clone()
    }
    const front: Polygon[] = []
    const back: Polygon[] = []
    for (const polygon of polygons) {
      this.plane.splitPolygon(polygon, this.polygons, this.polygons, front, back)
    }
    if (front.length) {
      if (!this.front) {
        this.front = new Node()
      }
      this.front.build(front)
    }
    if (back.length) {
      if (!this.back) {
        this.back = new Node()
      }
      this.back.build(back)
    }
  }
}
