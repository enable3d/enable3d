import {
  Geometry,
  BufferGeometry,
  Vector3,
  Shape,
  Vector2,
  WebGLRenderer,
  PerspectiveCamera,
  OrthographicCamera
} from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader'
import { Scene3D } from '..'

/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

export default class Transform {
  public root: Scene3D
  public renderer: WebGLRenderer
  public camera: PerspectiveCamera | OrthographicCamera
  public new: {
    svgLoader: () => SVGLoader
  }

  get transform() {
    return {
      geometryToBufferGeometry: (geometry: Geometry | BufferGeometry) => {
        // @ts-ignore
        if (geometry.isGeometry) return new BufferGeometry().fromGeometry(geometry)
        else return geometry as BufferGeometry
      },
      bufferGeometryToGeometry: (bufferGeometry: Geometry | BufferGeometry) => {
        // @ts-ignore
        if (bufferGeometry.isBufferGeometry) return new Geometry().fromBufferGeometry(bufferGeometry)
        else return bufferGeometry as Geometry
      },
      fromSVGtoShape: (key: string, isCCW?: boolean, noHoles?: boolean) =>
        this.transformFromSVGtoShape(key, isCCW, noHoles),
      from3dto2d: (position: Vector3) => this.transformFrom3dto2d(position),
      from2dto3d: (x: number, y: number, z: number = 0) => this.transformFrom2dto3d(x, y, z)
    }
  }

  /**
   * Transforms your svg files to paths. First load your svg files using 'this.load.html(path_to_file)' in preload().
   */
  private transformFromSVGtoShape(key: string, isCCW: boolean = false, noHoles?: boolean) {
    const svg = this.root.cache.html.get(key)
    if (svg) {
      const svgLoader = this.new.svgLoader()
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

  private transformFrom3dto2d(position: Vector3): Vector2 {
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
   * @param x X Position in Phaser Pixels.
   * @param y Y Position in Phaser Pixels.
   * @param z Z-Index of THREE Camera.
   */
  private transformFrom2dto3d(x: number, y: number, z: number = 0): Vector3 {
    const pps = this.getPixelsPerSquare(z)
    const canvas = this.renderer.domElement

    const centerX = canvas.width / 2 / pps
    const centerY = canvas.height / 2 / pps

    return new Vector3(-(centerX - x / pps), centerY - y / pps, z)
  }

  /**
   * Get the PixelPerSquare to be able to add to place 3D elements on a 2D surface.
   * The camera must have no rotation!
   * The camera must have no transformation on the x and y axis!
   * @param z The Z value of the THREE Camera you want to get the PixelPerSquare (PPS) from.
   */
  public getPixelsPerSquare(z: number = 0): number {
    let center = this.transform.from3dto2d(new Vector3(0, 0, z))
    let right = this.transform.from3dto2d(new Vector3(1, 0, z))
    return Math.abs(center.x - right.x)
  }
}
