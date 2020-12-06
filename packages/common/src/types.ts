/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import {
  MeshStandardMaterialParameters,
  MeshBasicMaterialParameters,
  MeshPhongMaterialParameters,
  LineBasicMaterialParameters,
  PointsMaterialParameters,
  MeshNormalMaterialParameters,
  PerspectiveCamera,
  OrthographicCamera,
  Shape,
  // ExtrudeGeometryOptions, // missing since three.js r121
  MeshLambertMaterialParameters,
  Texture,
  MeshToonMaterialParameters,
  MeshPhysicalMaterialParameters,
  Material,
  WebGLRenderer,
  Vector3,
  Quaternion
} from '@enable3d/three-wrapper/dist/index'
import { ExtendedObject3D } from './extendedObject3D'
import { ExtendedMesh } from './extendedMesh'

export { ExtendedObject3D }
export { ExtendedMesh }
// TODO fix this export
// export { ThirdPersonControls } from '../misc/thirdPersonControls'
export {
  AnimationMixer,
  AnimationClip,
  AnimationAction,
  Object3D,
  Mesh,
  Material,
  Line,
  Points,
  Group
} from '@enable3d/three-wrapper/dist/index'

export interface ThreeGraphicsConfig {
  anisotropy?: number
  /** Add your own THREE.js camera */
  camera?: PerspectiveCamera | OrthographicCamera
  enableXR?: boolean
  antialias?: boolean
  /** Default gravity is { y: -9.81 } */
  gravity?: { x: number; y: number; z: number }
  // Default is 1
  maxSubSteps?: number
  // Default is 1/60
  fixedTimeStep?: number
  renderer?: WebGLRenderer
  usePhysics?: boolean
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

export interface PerspectiveCameraConfig extends XYZ {
  fov?: number
  aspect?: number
  near?: number
  far?: number
}

export interface OrthographicCameraConfig extends XYZ {
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

export interface PlaneObject {
  (sphereConfig?: PlaneConfig, materialConfig?: MaterialConfig): ExtendedObject3D
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
export interface ConeObject {
  (coneConfig?: ConeConfig, materialConfig?: MaterialConfig): ExtendedObject3D
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

interface GeometryPhysicsOptions {
  /** Set the collision flags. 0 is DYNAMIC, 1 is STATIC, 2 is KINEMATIC, 4 GHOST */
  collisionFlags?: number
  collisionGroup?: number
  collisionMask?: number
  breakable?: boolean
  mass?: number
}

interface GeometryConfig extends GeometryPhysicsOptions {
  name?: string
  bufferGeometry?: boolean
}

export interface PlaneConfig extends GeometryConfig, XYZ, WH {
  widthSegments?: number
  heightSegments?: number
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
  radiusBody?: number
  height?: number
  radiusSegments?: number
  heightSegments?: number
  openEnded?: boolean
  thetaStart?: number
  thetaLength?: number
}

export interface ConeConfig extends GeometryConfig, XYZ, WH {
  radius?: number
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

export interface ExtrudeConfig extends GeometryConfig, XYZ /*, ExtrudeGeometryOptions */ {
  shape: Shape
  autoCenter?: boolean
}

export interface HeightMapConfig {
  material?: MaterialConfig
  // TODO add chrome types
  colorScale?: any // chroma.Scale<chroma.Color>
}

export type CustomCompoundShape = { shape: string; [property: string]: any }[]

export interface AddExistingConfig extends XYZ, GeometryPhysicsOptions {
  width?: number
  height?: number
  depth?: number
  radius?: number
  radiusTop?: number
  radiusBottom?: number
  shape?: string
  compound?: CustomCompoundShape
  autoCenter?: boolean
  axis?: string
  margin?: number
  offset?: XYZ
  orientation?: Quaternion
  addChildren?: boolean
}

export type CollisionEvent = 'start' | 'collision' | 'end'
