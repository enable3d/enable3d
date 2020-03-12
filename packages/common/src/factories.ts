/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import {
  MaterialConfig,
  SphereConfig,
  BoxConfig,
  GroundConfig,
  XYZ,
  CylinderConfig,
  ExtrudeConfig,
  TorusConfig,
  BoxObject,
  GroundObject,
  SphereObject,
  CylinderObject,
  ExtrudeObject,
  AddMaterial,
  PlaneObject,
  PlaneConfig,
  ConeObject,
  ConeConfig
} from './types'
import {
  SphereGeometry,
  BoxGeometry,
  Scene,
  MathUtils as THREE_Math,
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
  ExtrudeGeometry,
  MeshLambertMaterial,
  BoxBufferGeometry,
  SphereBufferGeometry,
  ExtrudeBufferGeometry,
  CylinderBufferGeometry,
  MeshPhysicalMaterial,
  MeshToonMaterial,
  TorusGeometry,
  TorusBufferGeometry,
  PlaneBufferGeometry,
  PlaneGeometry,
  DoubleSide,
  ConeBufferGeometry
} from '@enable3d/three-wrapper/src/index'
import ExtendedObject3D from './extendedObject3D'
import ExtendedMesh from './extendedMesh'
import logger from './logger'
import DefaultMaterial from './defaultMaterial'

export default class Factories {
  protected defaultMaterial: DefaultMaterial

  constructor(private scene: Scene) {
    this.defaultMaterial = new DefaultMaterial()
  }

  public get make(): {
    extrude: ExtrudeObject
    // geometries
    plane: PlaneObject
    box: BoxObject
    sphere: SphereObject
    cylinder: CylinderObject
    cone: ConeObject
    torus: (torusConfig?: TorusConfig, materialConfig?: MaterialConfig) => ExtendedObject3D
  } {
    return {
      plane: (planeConfig: PlaneConfig = {}, materialConfig: MaterialConfig = {}) =>
        this.makePlane(planeConfig, materialConfig),
      box: (boxConfig: BoxConfig = {}, materialConfig: MaterialConfig = {}) => this.makeBox(boxConfig, materialConfig),
      sphere: (sphereConfig: SphereConfig = {}, materialConfig: MaterialConfig = {}) =>
        this.makeSphere(sphereConfig, materialConfig),
      cylinder: (cylinderConfig: CylinderConfig = {}, materialConfig: MaterialConfig = {}) =>
        this.makeCylinder(cylinderConfig, materialConfig),
      cone: (coneConfig: ConeConfig = {}, materialConfig: MaterialConfig = {}) =>
        this.makeCone(coneConfig, materialConfig),
      torus: (torusConfig: TorusConfig = {}, materialConfig: MaterialConfig = {}) =>
        this.makeTorus(torusConfig, materialConfig),
      extrude: (extrudeConfig: ExtrudeConfig, materialConfig: MaterialConfig = {}) =>
        this.makeExtrude(extrudeConfig, materialConfig)
    }
  }

  public get add(): {
    mesh: any
    material: AddMaterial
    extrude: ExtrudeObject
    existing: any
    plane: PlaneObject
    ground: GroundObject
    // geometries
    box: BoxObject
    sphere: SphereObject
    cylinder: CylinderObject
    cone: ConeObject
    torus: (torusConfig?: TorusConfig, materialConfig?: MaterialConfig) => ExtendedObject3D
  } {
    return {
      // effectComposer: () => this.addEffectComposer(),
      mesh: (mesh: any) => this.addMesh(mesh),
      // group: (...children) => this.addGroup(children),
      existing: (object: ExtendedObject3D | Mesh | Line | Points) => this.addExisting(object),
      //  Geometry
      plane: (planeConfig: PlaneConfig = {}, materialConfig: MaterialConfig = {}) =>
        this.addPlane(planeConfig, materialConfig),
      box: (boxConfig: BoxConfig = {}, materialConfig: MaterialConfig = {}) => this.addBox(boxConfig, materialConfig),
      ground: (groundConfig: GroundConfig, materialConfig: MaterialConfig = {}) =>
        this.addGround(groundConfig, materialConfig),
      //...
      sphere: (sphereConfig: SphereConfig = {}, materialConfig: MaterialConfig = {}) =>
        this.addSphere(sphereConfig, materialConfig),
      cylinder: (cylinderConfig: CylinderConfig = {}, materialConfig: MaterialConfig = {}) =>
        this.addCylinder(cylinderConfig, materialConfig),
      cone: (coneConfig: ConeConfig = {}, materialConfig: MaterialConfig = {}) =>
        this.addCone(coneConfig, materialConfig),
      torus: (torusConfig: TorusConfig = {}, materialConfig: MaterialConfig = {}) =>
        this.addTorus(torusConfig, materialConfig),
      extrude: (extrudeConfig: ExtrudeConfig, materialConfig: MaterialConfig = {}) =>
        this.addExtrude(extrudeConfig, materialConfig),
      //...
      material: (materialConfig: MaterialConfig = {}) => this.addMaterial(materialConfig)
    }
  }

  private addExisting(object: ExtendedObject3D | Mesh | Line | Points) {
    this.scene.add(object)
  }

  private addMesh(mesh: Object3D) {
    if (Array.isArray(mesh)) {
      for (let i = 0; i < mesh.length; i++) {
        this.scene.add(mesh[i])
      }
    } else {
      this.scene.add(mesh)
    }
    return this
  }

  private createMesh(geometry: any, material: Material | Material[], position: XYZ): Line | Points | Mesh {
    const { x = 0, y = 0, z = 0 } = position

    let obj
    switch (!Array.isArray(material) && material.type) {
      case 'LineBasicMaterial':
        obj = new Line(geometry, material)
        break
      case 'PointsMaterial':
        obj = new Points(geometry, material)
        break
      default:
        obj = new ExtendedMesh(geometry, material)
        break
    }
    obj.position.set(x, y, z)
    obj.castShadow = obj.receiveShadow = true

    return obj
  }

  private makeExtrude(extrudeConfig: ExtrudeConfig, materialConfig: MaterialConfig) {
    const { x, y, z, name, shape, autoCenter = true, breakable = false, bufferGeometry = true, ...rest } = extrudeConfig
    const { depth = 1, bevelEnabled = false } = rest
    const geometry =
      bufferGeometry || breakable
        ? new ExtrudeBufferGeometry(shape, { depth, bevelEnabled, ...rest })
        : new ExtrudeGeometry(shape, { depth, bevelEnabled, ...rest })
    const material = this.addMaterial(materialConfig)
    const mesh = this.createMesh(geometry, material, { x, y, z }) as ExtendedObject3D
    // auto adjust the center for custom shapes
    if (autoCenter) mesh.geometry.center()
    mesh.name = name || `body_id_${mesh.id}`
    mesh.shape = 'extrude'
    return mesh
  }

  private addExtrude(extrudeConfig: ExtrudeConfig, materialConfig: MaterialConfig = {}): ExtendedObject3D {
    const obj = this.makeExtrude(extrudeConfig, materialConfig)
    this.scene.add(obj)
    return obj
  }

  private makePlane(planeConfig: PlaneConfig, materialConfig: MaterialConfig): ExtendedObject3D {
    const { x, y, z, name, breakable = false, bufferGeometry = true, ...rest } = planeConfig
    const geometry =
      bufferGeometry || breakable
        ? new PlaneBufferGeometry(rest.width || 1, rest.height || 1, rest.widthSegments || 1, rest.heightSegments || 1)
        : new PlaneGeometry(rest.width || 1, rest.height || 1, rest.widthSegments || 1, rest.heightSegments || 1)
    const material = this.addMaterial(materialConfig) as Material
    material.side = DoubleSide
    const mesh = this.createMesh(geometry, material, { x, y, z }) as ExtendedObject3D
    mesh.name = name || `body_id_${mesh.id}`
    mesh.shape = 'plane'
    return mesh
  }

  private addPlane(planeConfig: PlaneConfig, materialConfig: MaterialConfig): ExtendedObject3D {
    const obj = this.makePlane(planeConfig, materialConfig)
    this.scene.add(obj)
    return obj
  }

  private makeSphere(sphereConfig: SphereConfig, materialConfig: MaterialConfig): ExtendedObject3D {
    const { x, y, z, name, breakable = false, bufferGeometry = true, ...rest } = sphereConfig
    const geometry =
      bufferGeometry || breakable
        ? new SphereBufferGeometry(
            rest.radius || 1,
            rest.widthSegments || 16,
            rest.heightSegments || 12,
            rest.phiStart || undefined,
            rest.phiLength || undefined,
            rest.thetaStart || undefined,
            rest.thetaLength || undefined
          )
        : new SphereGeometry(
            rest.radius || 1,
            rest.widthSegments || 16,
            rest.heightSegments || 12,
            rest.phiStart || undefined,
            rest.phiLength || undefined,
            rest.thetaStart || undefined,
            rest.thetaLength || undefined
          )
    const material = this.addMaterial(materialConfig)
    const mesh = this.createMesh(geometry, material, { x, y, z }) as ExtendedObject3D
    mesh.name = name || `body_id_${mesh.id}`
    mesh.shape = 'sphere'
    return mesh
  }

  private addSphere(sphereConfig: SphereConfig = {}, materialConfig: MaterialConfig = {}): ExtendedObject3D {
    const obj = this.makeSphere(sphereConfig, materialConfig)
    this.scene.add(obj)
    return obj
  }

  private makeBox(boxConfig: BoxConfig, materialConfig: MaterialConfig): ExtendedObject3D {
    const { x, y, z, name, breakable = false, bufferGeometry = true, ...rest } = boxConfig
    const geometry =
      bufferGeometry || breakable
        ? new BoxBufferGeometry(
            rest.width || 1,
            rest.height || 1,
            rest.depth || 1,
            rest.widthSegments || undefined,
            rest.heightSegments || undefined,
            rest.depthSegments || undefined
          )
        : new BoxGeometry(
            rest.width || 1,
            rest.height || 1,
            rest.depth || 1,
            rest.widthSegments || undefined,
            rest.heightSegments || undefined,
            rest.depthSegments || undefined
          )
    const material = this.addMaterial(materialConfig)
    const mesh = this.createMesh(geometry, material, { x, y, z }) as ExtendedObject3D
    mesh.name = name || `body_id_${mesh.id}`
    mesh.shape = 'box'
    return mesh
  }

  private addBox(boxConfig: BoxConfig = {}, materialConfig: MaterialConfig = {}): ExtendedObject3D {
    const obj = this.makeBox(boxConfig, materialConfig)
    this.scene.add(obj)
    return obj
  }

  private addGround(groundConfig: GroundConfig, materialConfig: MaterialConfig = {}): ExtendedObject3D {
    const obj = this.makeBox(groundConfig, materialConfig)
    obj.rotateX(THREE_Math.degToRad(90))
    this.scene.add(obj)
    return obj
  }

  private makeCylinder(cylinderConfig: CylinderConfig = {}, materialConfig: MaterialConfig = {}): ExtendedObject3D {
    const { x, y, z, name, breakable = false, bufferGeometry = true, ...rest } = cylinderConfig
    const geometry =
      bufferGeometry || breakable
        ? new CylinderBufferGeometry(
            rest.radiusTop || 1,
            rest.radiusBottom || 1,
            rest.height || 1,
            rest.radiusSegments || undefined,
            rest.heightSegments || undefined,
            rest.openEnded || undefined,
            rest.thetaStart || undefined,
            rest.thetaLength || undefined
          )
        : new CylinderGeometry(
            rest.radiusTop || 1,
            rest.radiusBottom || 1,
            rest.height || 1,
            rest.radiusSegments || undefined,
            rest.heightSegments || undefined,
            rest.openEnded || undefined,
            rest.thetaStart || undefined,
            rest.thetaLength || undefined
          )
    const material = this.addMaterial(materialConfig)
    const mesh = this.createMesh(geometry, material, { x, y, z }) as ExtendedObject3D
    mesh.name = name || `body_id_${mesh.id}`
    mesh.shape = 'cylinder'
    return mesh
  }

  private addCylinder(cylinderConfig: CylinderConfig = {}, materialConfig: MaterialConfig = {}): ExtendedObject3D {
    const obj = this.makeCylinder(cylinderConfig, materialConfig)
    this.scene.add(obj)
    return obj
  }

  private makeCone(coneConfig: ConeConfig = {}, materialConfig: MaterialConfig = {}): ExtendedObject3D {
    const { x, y, z, name, breakable = false, bufferGeometry = true, ...rest } = coneConfig
    const geometry =
      bufferGeometry || breakable
        ? new ConeBufferGeometry(
            rest.radius || 1,
            rest.height || 1,
            rest.radiusSegments || 8,
            rest.heightSegments || 1,
            rest.openEnded || false,
            rest.thetaStart || 0,
            rest.thetaLength || 2 * Math.PI
          )
        : new ConeBufferGeometry(
            rest.radius || 1,
            rest.height || 1,
            rest.radiusSegments || 8,
            rest.heightSegments || 1,
            rest.openEnded || false,
            rest.thetaStart || 0,
            rest.thetaLength || 2 * Math.PI
          )
    const material = this.addMaterial(materialConfig)
    const mesh = this.createMesh(geometry, material, { x, y, z }) as ExtendedObject3D
    mesh.name = name || `body_id_${mesh.id}`
    mesh.shape = 'cone'
    return mesh
  }

  private addCone(coneConfig: ConeConfig = {}, materialConfig: MaterialConfig = {}): ExtendedObject3D {
    const obj = this.makeCone(coneConfig, materialConfig)
    this.scene.add(obj)
    return obj
  }

  // https://threejs.org/docs/index.html#api/en/geometries/TorusBufferGeometry
  private makeTorus(torusConfig: TorusConfig = {}, materialConfig: MaterialConfig = {}): ExtendedObject3D {
    const { x, y, z, name, breakable = false, bufferGeometry = true, ...rest } = torusConfig
    const geometry =
      bufferGeometry || breakable
        ? new TorusBufferGeometry(
            rest.radius || undefined,
            rest.tube || undefined,
            rest.radialSegments || undefined,
            rest.tubularSegments || undefined,
            rest.arc || undefined
          )
        : new TorusGeometry(
            rest.radius || undefined,
            rest.tube || undefined,
            rest.radialSegments || undefined,
            rest.tubularSegments || undefined,
            rest.arc || undefined
          )
    const material = this.addMaterial(materialConfig)
    const mesh = this.createMesh(geometry, material, { x, y, z }) as ExtendedObject3D
    mesh.name = name || `body_id_${mesh.id}`
    mesh.shape = 'torus'
    return mesh
  }

  private addTorus(torusConfig: TorusConfig = {}, materialConfig: MaterialConfig = {}): ExtendedObject3D {
    const obj = this.makeTorus(torusConfig, materialConfig)
    this.scene.add(obj)
    return obj
  }

  private addMaterial(materialConfig: MaterialConfig = {}) {
    const type = Object.keys(materialConfig)[0]
    let material: Material | Material[]

    // if (type) {
    //   const { map } = materialConfig[type]
    //   if (typeof map === 'string') materialConfig[type].map = this.loadTexture(map)
    // }

    switch (type) {
      case 'basic':
        material = new MeshBasicMaterial(materialConfig.basic)
        break
      case 'normal':
        material = new MeshNormalMaterial(materialConfig.normal)
        break
      case 'standard':
        material = new MeshStandardMaterial(materialConfig.standard)
        break
      case 'lambert':
        material = new MeshLambertMaterial(materialConfig.lambert)
        break
      case 'phong':
        material = new MeshPhongMaterial(materialConfig.phong)
        break
      case 'physical':
        if (typeof materialConfig.physical !== 'undefined') {
          material = new MeshPhysicalMaterial(materialConfig.physical)
        } else {
          logger('You need to pass parameters to the physical material. (Fallback to default material)')
          material = this.defaultMaterial.get()
        }
        break
      case 'toon':
        material = new MeshToonMaterial(materialConfig.toon)
        break
      case 'line':
        material = new LineBasicMaterial(materialConfig.line)
        break
      case 'points':
        material = new PointsMaterial(materialConfig.points)
        break
      case 'custom':
        material = materialConfig.custom || this.defaultMaterial.get()
        break
      default:
        material = this.defaultMaterial.get()
        break
    }

    return material
  }
}
