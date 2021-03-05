/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import * as THREE from 'three'

import { VRButton } from 'three/examples/jsm/webxr/VRButton'
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory'

export default class WebXR {
  // dot: THREE.Mesh
  cameraGroup: THREE.Group
  controllerModelFactory = new XRControllerModelFactory()

  constructor(
    private _renderer: THREE.WebGLRenderer,
    private _scene: THREE.Scene,
    private _camera: THREE.PerspectiveCamera | THREE.OrthographicCamera
  ) {
    // https://medium.com/samsung-internet-dev/vr-locomotion-740dafa85914

    // const geo = new THREE.SphereGeometry(0.5)
    // const mat = new THREE.MeshLambertMaterial({ color: 0xff0000 })
    // this.dot = new THREE.Mesh(geo, mat)
    // this.dot.position.set(0, 1, 0)
    this.cameraGroup = new THREE.Group()
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
    // https://github.com/mrdoob/three.js/blob/master/examples/webxr_vr_ballshooter.html

    const { targetRayMode } = data

    if (targetRayMode === 'tracked-pointer') {
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, -1], 3))
      geometry.setAttribute('color', new THREE.Float32BufferAttribute([1, 0, 0, 1, 1, 1], 3))

      const material = new THREE.LineBasicMaterial({
        vertexColors: true
      })

      return new THREE.Line(geometry, material)
    }

    if (targetRayMode === 'gaze') {
      const geometry = new THREE.RingBufferGeometry(0.02, 0.04, 32).translate(0, 0, -1)
      const material = new THREE.MeshBasicMaterial({ color: 'red', opacity: 0.5, transparent: true })
      return new THREE.Mesh(geometry, material)
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
      getWorldDirection: (target: THREE.Vector3) =>
        this.isPresenting ? this._renderer.xr.getCamera(this._camera).getWorldDirection(target) : undefined
    }
  }
}
