/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  RingBufferGeometry,
  Scene,
  Vector3,
  WebGLRenderer
} from 'three'

import { VRButton } from 'three/examples/jsm/webxr/VRButton.js'
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js'

export default class WebXR {
  // dot: Mesh
  cameraGroup: Group
  controllerModelFactory = new XRControllerModelFactory()

  constructor(
    private _renderer: WebGLRenderer,
    private _scene: Scene,
    private _camera: PerspectiveCamera | OrthographicCamera
  ) {
    // https://medium.com/samsung-internet-dev/vr-locomotion-740dafa85914

    // const geo = new SphereGeometry(0.5)
    // const mat = new MeshLambertMaterial({ color: 0xff0000 })
    // this.dot = new Mesh(geo, mat)
    // this.dot.position.set(0, 1, 0)
    this.cameraGroup = new Group()
    this.cameraGroup.add(_camera)
    _scene.add(this.cameraGroup)

    _renderer.xr.enabled = true

    // add vr button
    const vrButton = VRButton.createButton(_renderer)
    vrButton.style.cssText += 'background: rgba(0, 0, 0, 0.8); '
    document.body.appendChild(vrButton)
  }

  public get isPresenting() {
    return !!this._renderer?.xr?.isPresenting
  }

  public getController(id: number) {
    const controller = this._renderer.xr.getController(id)
    this.cameraGroup.add(controller)
    return controller
  }

  public getControllerGrip(id: number) {
    const controllerGrip = this._renderer.xr.getControllerGrip(id)
    const model = this.controllerModelFactory.createControllerModel(controllerGrip)

    controllerGrip.add(model)
    this.cameraGroup.add(controllerGrip)
    return controllerGrip
  }

  public getControllerRay(data: any) {
    // https://github.com/mrdoob/js/blob/master/examples/webxr_vr_ballshooter.html

    const { targetRayMode } = data

    if (targetRayMode === 'tracked-pointer') {
      const geometry = new BufferGeometry()
      geometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 0, 0, -1], 3))
      geometry.setAttribute('color', new Float32BufferAttribute([1, 0, 0, 1, 1, 1], 3))

      const material = new LineBasicMaterial({
        vertexColors: true
      })

      return new Line(geometry, material)
    }

    if (targetRayMode === 'gaze') {
      const geometry = new RingBufferGeometry(0.02, 0.04, 32).translate(0, 0, -1)
      const material = new MeshBasicMaterial({ color: 'red', opacity: 0.5, transparent: true })
      return new Mesh(geometry, material)
    }

    return
  }

  public get camera() {
    return this.WebXRCamera
  }

  private get WebXRCamera() {
    return {
      group: this.cameraGroup,
      position: this.cameraGroup?.position,
      rotation: this.isPresenting ? this._renderer.xr.getCamera(this._camera).rotation : undefined,
      getWorldDirection: (target: Vector3) =>
        this.isPresenting ? this._renderer.xr.getCamera(this._camera).getWorldDirection(target) : undefined
    }
  }
}
