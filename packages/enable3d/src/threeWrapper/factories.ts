/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2019 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { MaterialConfig, SphereConfig, BoxConfig, GroundConfig, XYZ } from '../types'
import {
  SphereGeometry,
  BoxGeometry,
  Scene,
  Math as THREE_Math,
  Object3D,
  Material,
  Line,
  Points,
  Mesh,
  MeshStandardMaterial,
  MeshNormalMaterial,
  MeshPhongMaterial,
  LineBasicMaterial,
  PointsMaterial,
  MeshBasicMaterial
} from 'three'
import Textures from './textures'
import ExtendedObject3D from '../extendedObject3D'

export default class Factories extends Textures {
  scene: Scene
  protected addMesh(mesh: Object3D) {
    if (Array.isArray(mesh)) {
      for (let i = 0; i < mesh.length; i++) {
        this.scene.add(mesh[i])
      }
    } else {
      this.scene.add(mesh)
    }
    return this
  }

  protected createMesh(geometry: any, material: Material, position: XYZ): Line | Points | Mesh {
    const { x = 1, y = 1, z = 1 } = position

    let obj
    switch (material.type) {
      case 'LineBasicMaterial':
        obj = new Line(geometry, material)
        break
      case 'PointsMaterial':
        obj = new Points(geometry, material)
        break
      default:
        obj = new Mesh(geometry, material)
        break
    }
    obj.position.set(x, y, z)
    obj.castShadow = obj.receiveShadow = true

    return obj
  }
  protected makeSphere(
    { radius = 1, widthSegments = 16, heightSegments = 12, x = 0, y = 0, z = 0, name = undefined }: SphereConfig,
    materialConfig: MaterialConfig
  ): ExtendedObject3D {
    const geometry = new SphereGeometry(radius, widthSegments, heightSegments)
    const material = this.createMaterialNEW(materialConfig)
    const mesh = this.createMesh(geometry, material, { x, y, z }) as ExtendedObject3D
    mesh.name = name || `body_id_${mesh.id}`
    mesh.shape = 'sphere'
    return mesh
  }

  protected addSphere(sphereConfig: SphereConfig = {}, materialConfig: MaterialConfig = {}): ExtendedObject3D {
    const obj = this.makeSphere(sphereConfig, materialConfig)
    this.scene.add(obj)
    return obj
  }

  protected makeBox(
    { width = 1, height = 1, depth = 1, x = 0, y = 0, z = 0, name = undefined }: BoxConfig,
    materialConfig: MaterialConfig
  ): ExtendedObject3D {
    const geometry = new BoxGeometry(width, height, depth)
    const material = this.createMaterialNEW(materialConfig)
    const mesh = this.createMesh(geometry, material, { x, y, z }) as ExtendedObject3D
    mesh.name = name || `body_id_${mesh.id}`
    mesh.type = 'box'
    return mesh
  }

  protected addBox(boxConfig: BoxConfig = {}, materialConfig: MaterialConfig = {}): ExtendedObject3D {
    const obj = this.makeBox(boxConfig, materialConfig)
    this.scene.add(obj)
    return obj
  }

  protected addGround(groundConfig: GroundConfig, materialConfig: MaterialConfig): ExtendedObject3D {
    const obj = this.makeBox(groundConfig, materialConfig)
    obj.name = groundConfig.name || `body_id_${obj.id}`
    obj.rotateX(THREE_Math.degToRad(90))
    this.scene.add(obj)
    return obj
  }
  protected createMaterialNEW(materialConfig: MaterialConfig = {}) {
    const type = Object.keys(materialConfig)[0]
    let material: Material

    if (type) {
      const { map } = materialConfig[type]
      if (typeof map === 'string') materialConfig[type].map = this.loadTexture(map)
    }

    switch (type) {
      case 'standard':
        material = new MeshStandardMaterial(materialConfig.standard)
        break
      case 'basic':
        material = new MeshBasicMaterial(materialConfig.basic)
        break
      case 'normal':
        material = new MeshNormalMaterial(materialConfig.normal)
        break
      case 'phong':
        material = new MeshPhongMaterial(materialConfig.phong)
        break
      case 'line':
        material = new LineBasicMaterial(materialConfig.line)
        break
      case 'points':
        material = new PointsMaterial(materialConfig.points)
        break
      default:
        material = new MeshStandardMaterial(materialConfig.standard)
        break
    }

    return material
  }
}
