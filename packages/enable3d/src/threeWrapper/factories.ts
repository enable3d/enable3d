/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2019 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { MaterialConfig, SphereConfig, BoxConfig, GroundConfig, XYZ, CylinderConfig, ExtrudeConfig } from '../types'
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
  MeshBasicMaterial,
  CylinderGeometry,
  ExtrudeGeometry
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
    const { x = 0, y = 0, z = 0 } = position

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

  protected makeExtrude(extrudeConfig: ExtrudeConfig, materialConfig: MaterialConfig) {
    const { x, y, z, name, shape, autoCenter = true, ...rest } = extrudeConfig
    const geometry = new ExtrudeGeometry(shape, rest)
    const material = this.createMaterial(materialConfig)
    const mesh = this.createMesh(geometry, material, { x, y, z }) as ExtendedObject3D
    // auto adjust the center for custom shapes
    if (autoCenter) mesh.geometry.center()
    mesh.name = name || `body_id_${mesh.id}`
    mesh.shape = 'extrude'
    return mesh
  }

  protected addExtrude(extrudeConfig: ExtrudeConfig, materialConfig: MaterialConfig = {}): ExtendedObject3D {
    const obj = this.makeExtrude(extrudeConfig, materialConfig)
    this.scene.add(obj)
    return obj
  }

  protected makeSphere(sphereConfig: SphereConfig, materialConfig: MaterialConfig): ExtendedObject3D {
    const { x, y, z, name, ...rest } = sphereConfig
    const geometry = new SphereGeometry(
      rest.radius || 1,
      rest.widthSegments || 16,
      rest.heightSegments || 12,
      rest.phiStart || undefined,
      rest.phiLength || undefined,
      rest.thetaStart || undefined,
      rest.thetaLength || undefined
    )
    const material = this.createMaterial(materialConfig)
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

  protected makeBox(boxConfig: BoxConfig, materialConfig: MaterialConfig): ExtendedObject3D {
    const { x, y, z, name, ...rest } = boxConfig
    const geometry = new BoxGeometry(
      rest.width || 1,
      rest.height || 1,
      rest.depth || 1,
      rest.widthSegments || undefined,
      rest.heightSegments || undefined,
      rest.depthSegments || undefined
    )
    const material = this.createMaterial(materialConfig)
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

  protected addGround(groundConfig: GroundConfig, materialConfig: MaterialConfig = {}): ExtendedObject3D {
    const obj = this.makeBox(groundConfig, materialConfig)
    obj.rotateX(THREE_Math.degToRad(90))
    this.scene.add(obj)
    return obj
  }

  protected makeCylinder(cylinderConfig: CylinderConfig = {}, materialConfig: MaterialConfig = {}): ExtendedObject3D {
    const { x, y, z, name, ...rest } = cylinderConfig
    const geometry = new CylinderGeometry(
      rest.radiusTop || undefined,
      rest.radiusBottom || undefined,
      rest.height || undefined,
      rest.radiusSegments || undefined,
      rest.heightSegments || undefined,
      rest.openEnded || undefined,
      rest.thetaStart || undefined,
      rest.thetaLength || undefined
    )
    const material = this.createMaterial(materialConfig)
    const mesh = this.createMesh(geometry, material, { x, y, z }) as ExtendedObject3D
    mesh.name = name || `body_id_${mesh.id}`
    mesh.shape = 'cylinder'
    return mesh
  }

  protected addCylinder(cylinderConfig: CylinderConfig = {}, materialConfig: MaterialConfig = {}): ExtendedObject3D {
    const obj = this.makeCylinder(cylinderConfig, materialConfig)
    this.scene.add(obj)
    return obj
  }

  protected createMaterial(materialConfig: MaterialConfig = {}) {
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
