/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2019 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import ExtendedObject3D from './extendedObject3D'
import { PerspectiveCamera, OrthographicCamera, WebGLRenderer, ArrayCamera } from 'three'

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

  public get xr() {
    return {
      getController: (id: number) => this.renderer.vr.getController(id),
      camera: this.WebXRCamera
    }
  }

  private get WebXRCamera() {
    return {
      object3D: this.cameraObject,
      position: this.cameraObject?.position,
      // @ts-ignore
      rotation: this.renderer.vr.getCamera(this.camera).rotation,
      // @ts-ignore
      getWorldDirection: (target: Vector3) => this.renderer.vr.getCamera(this.camera).getWorldDirection(target)
    }
  }
}
