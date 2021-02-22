import { MeshLambertMaterial } from 'three'

class DefaultMaterial {
  private _defaultMaterial: MeshLambertMaterial
  constructor() {
    this._defaultMaterial = new MeshLambertMaterial({ color: 0xcccccc })
  }

  public get() {
    return this._defaultMaterial
  }
}

export default DefaultMaterial
