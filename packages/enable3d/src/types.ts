/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2019 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import {
  MeshStandardMaterialParameters,
  MeshBasicMaterialParameters,
  MeshPhongMaterialParameters,
  LineBasicMaterialParameters,
  PointsMaterialParameters,
  MeshNormalMaterialParameters,
  PerspectiveCamera as THREE_PerspectiveCamera,
  OrthographicCamera as THREE_OrthographicCamera,
  Shape,
  ExtrudeGeometryOptions,
  MeshLambertMaterialParameters,
  Texture,
  MeshToonMaterialParameters,
  MeshPhysicalMaterialParameters,
  Material
} from 'three'
import ExtendedObject3D from './threeWrapper/extendedObject3D'

export { ExtendedObject3D }
export { AnimationAction } from 'three/src/animation/AnimationAction'
export { ThirdPersonControls } from './utils/thirdPersonControls'
export { AnimationMixer, AnimationClip, Object3D, Mesh, Material, Line, Points, Group, Vector3, Vector2 } from 'three'

export interface Phaser3DConfig {
  anisotropy?: number
  /** Add your own THREE.js camera */
  camera?: THREE_PerspectiveCamera | THREE_OrthographicCamera
  enableXR?: boolean
  /** Default gravity is { y: -9.81 } */
  gravity?: { x: number; y: number; z: number }
  // Default is 1
  maxSubSteps?: number
  // Default is 1/60
  fixedTimeStep?: number
}

export interface XYZ {
  x?: number
  y?: number
  z?: number
}

interface WH {
  width?: number
  height?: number
}

export type Color = number | string

interface Makeup {
  texture?: any
  color?: Color
  material?: any
}

export interface PerspectiveCamera extends XYZ {
  fov?: number
  aspect?: number
  near?: number
  far?: number
}

export interface OrthographicCamera extends XYZ {
  left?: number
  right?: number
  top?: number
  bottom?: number
  near?: number
  far?: number
}

/**
 * Choose your preferred material. The default is MeshLambertMaterial with a color of 0xcccccc.
 */
export interface MaterialConfig {
  basic?: MeshBasicMaterialParameters
  normal?: MeshNormalMaterialParameters
  standard?: MeshStandardMaterialParameters
  lambert?: MeshLambertMaterialParameters
  phong?: MeshPhongMaterialParameters
  physical?: MeshPhysicalMaterialParameters
  toon?: MeshToonMaterialParameters
  line?: LineBasicMaterialParameters
  points?: PointsMaterialParameters
  custom?: Material | Material[]
  [key: string]: any
}

export interface SphereObject {
  (sphereConfig?: SphereConfig, materialConfig?: MaterialConfig): ExtendedObject3D
}
export interface BoxObject {
  (boxConfig?: BoxConfig, materialConfig?: MaterialConfig): ExtendedObject3D
}
export interface GroundObject {
  (groundConfig: GroundConfig, materialConfig?: MaterialConfig): ExtendedObject3D
}
export interface CylinderObject {
  (cylinderConfig?: CylinderConfig, materialConfig?: MaterialConfig): ExtendedObject3D
}
export interface ExtrudeObject {
  (extrudeConfig: ExtrudeConfig, materialConfig?: MaterialConfig): ExtendedObject3D
}
export interface HeightMapObject {
  (texture: Texture, config?: HeightMapConfig): ExtendedObject3D | undefined
}
export interface AddMaterial {
  (materialConfig?: MaterialConfig): Material | Material[]
}

interface GeometryConfig {
  name?: string
  friction?: number
  collisionFlag?: number
  breakable?: boolean
  mass?: number
  bufferGeometry?: boolean
}

export interface SphereConfig extends GeometryConfig, XYZ {
  radius?: number
  widthSegments?: number
  heightSegments?: number
  phiStart?: number
  phiLength?: number
  thetaStart?: number
  thetaLength?: number
}

export interface BoxConfig extends GeometryConfig, XYZ, WH {
  depth?: number
  widthSegments?: number
  heightSegments?: number
  depthSegments?: number
}

export interface GroundConfig extends BoxConfig {
  width?: number
  height?: number
}

export interface CylinderConfig extends GeometryConfig, XYZ, WH {
  radiusTop?: number
  radiusBottom?: number
  height?: number
  radiusSegments?: number
  heightSegments?: number
  openEnded?: boolean
  thetaStart?: number
  thetaLength?: number
}

export interface TorusConfig extends GeometryConfig, XYZ {
  radius?: number
  tube?: number
  radialSegments?: number
  tubularSegments?: number
  arc?: number
}

export interface ExtrudeConfig extends GeometryConfig, XYZ, ExtrudeGeometryOptions {
  shape: Shape
  autoCenter?: boolean
}

export interface HeightMapConfig {
  material?: MaterialConfig
  colorScale?: chroma.Scale<chroma.Color>
}

export interface AddExistingConfig {
  width?: number
  height?: number
  depth?: number
  radius?: number
  shape?: string
  shapes?: AddExistingConfig[]
  mass?: number
  autoCenter?: boolean
  offset?: { x?: number; y?: number; z?: number }
}
