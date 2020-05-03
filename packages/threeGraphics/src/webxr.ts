/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import ExtendedObject3D from '@enable3d/common/dist/extendedObject3D'
import {
  PerspectiveCamera,
  OrthographicCamera,
  WebGLRenderer,
  ArrayCamera,
  Vector3
} from '@enable3d/three-wrapper/dist/index'

export default class WebXR {
  private cameraObject: ExtendedObject3D
  public camera: PerspectiveCamera | OrthographicCamera
  protected add: any
  protected new: any
  public renderer: WebGLRenderer

  protected addXRCamera() {
    this.cameraObject = this.add.sphere(
      { radius: 0.1, y: 5, z: 2 },
      { standard: { transparent: true, opacity: 0.5, color: 0xff0000 } }
    )
    this.cameraObject.add(this.camera)
  }

  private get isPresenting() {
    return !!this.renderer?.xr?.isPresenting
  }

  public get xr(): any {
    return {
      getController: (id: number) => this.renderer.xr.getController(id),
      camera: this.WebXRCamera,
      isPresenting: this.isPresenting
    }
  }

  private get WebXRCamera() {
    return {
      object3D: this.cameraObject,
      position: this.cameraObject?.position,
      rotation: this.isPresenting ? this.renderer.xr.getCamera(this.camera).rotation : undefined,
      getWorldDirection: (target: Vector3) =>
        this.isPresenting ? this.renderer.xr.getCamera(this.camera).getWorldDirection(target) : undefined
    }
  }
}
