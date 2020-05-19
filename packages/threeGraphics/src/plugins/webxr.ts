/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import * as THREE from '@enable3d/three-wrapper/dist/index'

export default class WebXR {
  constructor(
    private _renderer: THREE.WebGLRenderer,
    private _camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    /** Attach the camera to this object */
    public cameraObject: THREE.Object3D
  ) {}

  /** Creates a new WebXR instance to initialize the Plugin */
  static Enable(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera | THREE.OrthographicCamera) {
    // create red sphere
    const geo = new THREE.SphereGeometry(0.1)
    const mat = new THREE.MeshLambertMaterial({ transparent: true, opacity: 0.5, color: 0xff0000 })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(0, 5, 2)

    // the xr renderer is always window.innerWidth and window.innerHeight
    renderer.xr.enabled = true
    const webXR = new WebXR(renderer, camera, mesh)
    webXR.addCamera()
    // add vr button
    const vrButton = THREE.VRButton.createButton(renderer)
    vrButton.style.cssText += 'background: rgba(0, 0, 0, 0.8); '
    document.body.appendChild(vrButton)

    return webXR
  }

  public addCamera() {
    this.cameraObject.add(this._camera)
  }

  public get isPresenting() {
    return !!this._renderer?.xr?.isPresenting
  }

  public getController(id: number) {
    return this._renderer.xr.getController(id)
  }

  public get camera() {
    return this.WebXRCamera
  }

  private get WebXRCamera() {
    return {
      object3D: this.cameraObject,
      position: this.cameraObject?.position,
      rotation: this.isPresenting ? this._renderer.xr.getCamera(this._camera).rotation : undefined,
      getWorldDirection: (target: THREE.Vector3) =>
        this.isPresenting ? this._renderer.xr.getCamera(this._camera).getWorldDirection(target) : undefined
    }
  }
}
