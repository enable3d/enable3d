import { MeshStandardMaterial } from 'three'
import { extendToGridPrototypeMaterial } from './proceduralPrototypeGridShader.js'

class DefaultMaterial {
  private _defaultMaterial: MeshStandardMaterial
  private _defaultMaterialDynamic: MeshStandardMaterial
  private _defaultMaterialStatic: MeshStandardMaterial
  private _defaultMaterialKinematic: MeshStandardMaterial

  constructor() {
    this._defaultMaterial = new MeshStandardMaterial()
    this._defaultMaterial.metalness = 0
    this._defaultMaterial.roughness = 0
    this._defaultMaterial.userData = { defaultMaterial: true }
    extendToGridPrototypeMaterial(this._defaultMaterial, {
      margin: 0,
      radius: 0,
      gap: 0,
      topLeftText: '',
      topRightText: '',
      bottomRightText: '',
      color1: '#dfdfdf',
      color2: '#d4d4d4'
    })

    this._defaultMaterialDynamic = new MeshStandardMaterial()
    this._defaultMaterialDynamic.metalness = 0
    this._defaultMaterialDynamic.roughness = 0
    this._defaultMaterialDynamic.userData = { defaultMaterial: true }
    extendToGridPrototypeMaterial(this._defaultMaterialDynamic, {
      margin: 0,
      radius: 0,
      gap: 0,
      topLeftText: '',
      topRightText: '',
      bottomRightText: '',
      color1: '#3cb2fc',
      color2: '#0b9ffc'
    })

    this._defaultMaterialStatic = new MeshStandardMaterial()
    this._defaultMaterialStatic.metalness = 0
    this._defaultMaterialStatic.roughness = 0
    this._defaultMaterialStatic.userData = { defaultMaterial: true }
    extendToGridPrototypeMaterial(this._defaultMaterialStatic, {
      margin: 0,
      radius: 0,
      gap: 0,
      topLeftText: '',
      topRightText: '',
      bottomRightText: '',
      color1: '#00d604',
      color2: '#00c204'
    })

    this._defaultMaterialKinematic = new MeshStandardMaterial()
    this._defaultMaterialKinematic.metalness = 0
    this._defaultMaterialKinematic.roughness = 0
    this._defaultMaterialKinematic.userData = { defaultMaterial: true }
    extendToGridPrototypeMaterial(this._defaultMaterialKinematic, {
      margin: 0,
      radius: 0,
      gap: 0,
      topLeftText: '',
      topRightText: '',
      bottomRightText: '',
      color1: '#ffff00',
      color2: '#ebeb00'
    })
  }

  public getDynamic() {
    return this._defaultMaterialDynamic
  }
  public getStatic() {
    return this._defaultMaterialStatic
  }
  public getKinematic() {
    return this._defaultMaterialKinematic
  }
  public get() {
    return this._defaultMaterial
  }
}

export default DefaultMaterial
