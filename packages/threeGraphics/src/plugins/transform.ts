import { ExtendedObject3D } from '@enable3d/ammo-physics'
import {
  Geometry,
  BufferGeometry,
  Vector3,
  Shape,
  Vector2,
  WebGLRenderer,
  PerspectiveCamera,
  OrthographicCamera,
  Raycaster,
  PlaneBufferGeometry,
  MeshBasicMaterial,
  Mesh
} from '@enable3d/three-wrapper/dist/index'
import { SVGLoader } from '@enable3d/three-wrapper/dist/index'
import { fromGeometry } from './csg/_fromGeometry'

/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

export default class Transform {
  tmpPlane: Mesh
  tmpRaycaster: Raycaster
  tmpVector3: Vector3

  constructor(private camera: PerspectiveCamera | OrthographicCamera, private renderer: WebGLRenderer) {}

  public geometryToBufferGeometry(geometry: Geometry) {
    if (geometry.isGeometry) return fromGeometry(new BufferGeometry(), geometry)
    else return geometry as any
  }

  public bufferGeometryToGeometry(bufferGeometry: BufferGeometry) {
    if (bufferGeometry.isBufferGeometry) return new Geometry().fromBufferGeometry(bufferGeometry)
    else return bufferGeometry as any
  }

  /**
   * Transforms your svg files to paths.
   */
  public fromSVGtoShape(svg: string, isCCW: boolean = false, noHoles?: boolean) {
    if (svg) {
      const svgLoader = new SVGLoader()
      const shapes: Shape[] = []
      svgLoader.parse(svg).paths.forEach(path => {
        path.toShapes(isCCW, noHoles).forEach(shape => {
          shapes.push(shape)
        })
      })
      return shapes
    }
    return []
  }

  public from3dto2d(position: Vector3): Vector2 {
    const vector3 = new Vector3(position.x, position.y, position.z)
    const canvas = this.renderer.domElement

    // map to normalized device coordinate (NDC) space
    this.camera.updateMatrixWorld()
    vector3.project(this.camera)

    // map to 2D screen space
    const x = Math.round((vector3.x + 1) * (canvas.width / 2))
    const y = Math.round((-vector3.y + 1) * (canvas.height / 2))
    return new Vector2(x, y)
  }

  /**
   *
   * @param x X coordinate in normalized device coordinate (NDC) (-1 to +1).
   * @param y Y coordinate in normalized device coordinate (NDC) (-1 to +1).
   * @param distanceFromCamera The distance from the camera.
   */
  public from2dto3d(x: number, y: number, distanceFromCamera: number): Vector3 | undefined {
    // initialize temporary variables
    if (!this.tmpPlane) {
      const geo = new PlaneBufferGeometry(10_000, 10_000)
      const mat = new MeshBasicMaterial({ transparent: true, opacity: 0.25 })
      this.tmpPlane = new Mesh(geo, mat)
      this.tmpPlane.name = '_tmp_raycast_plane'
    }
    if (!this.tmpRaycaster) this.tmpRaycaster = new Raycaster()
    if (!this.tmpVector3) this.tmpVector3 = new Vector3()

    // holds the position we want to return later
    let position

    // add plane parallel to camera
    this.tmpPlane.setRotationFromEuler(this.camera.rotation)
    const p = this.camera.position
    this.tmpPlane.position.set(p.x, p.y, p.z)

    // adjust the distance of the plane
    this.camera.getWorldDirection(this.tmpVector3)
    this.tmpPlane.position.add(this.tmpVector3.clone().multiplyScalar(distanceFromCamera))
    this.tmpPlane.updateMatrix()
    this.tmpPlane.updateMatrixWorld(true)

    // raycast
    this.tmpRaycaster.setFromCamera({ x, y }, this.camera)

    // check intersection with plane
    const intersects = this.tmpRaycaster.intersectObjects([this.tmpPlane])
    if (intersects[0]?.object.name === '_tmp_raycast_plane') position = intersects[0].point

    return position
  }
}
