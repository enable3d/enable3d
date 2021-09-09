import { ExtendedObject3D, PhysicsLoader, Project, Scene3D, THREE } from 'enable3d'

import { TypeBufferGeometry, processGeometry } from './tmp'
import { BufferGeometry, Matrix4, MeshPhongMaterial, Object3D, SkinnedMesh } from 'three'

import * as PKG from 'three/examples/jsm/utils/BufferGeometryUtils'
const { BufferGeometryUtils } = PKG

// import { iterateGeometries } from '../../ammoPhysics/dist/three-to-ammo'

class MainScene extends Scene3D {
  cube!: Object3D

  async preload() {
    await this.load.preload('cube', '/assets/cube.glb')
  }

  addSoftBody(object: Object3D, mass: number = 10, pressure: number = 100, margin = 0.05) {
    let _child!: THREE.Mesh
    object.traverse((child: any) => {
      if (child.isMesh) {
        _child = child
      }
    })

    let geometry = _child.geometry as TypeBufferGeometry

    processGeometry(geometry)

    const { ammoVertices, ammoIndices } = geometry

    const softBodyHelpers = new Ammo.btSoftBodyHelpers()
    const volumeSoftBody = softBodyHelpers.CreateFromTriMesh(
      this.physics.physicsWorld.getWorldInfo(),
      ammoVertices,
      ammoIndices,
      ammoIndices.length / 3,
      true // true
    )

    const sbConfig = volumeSoftBody.get_m_cfg()
    sbConfig.set_viterations(30)
    sbConfig.set_piterations(30)

    // Soft-soft and soft-rigid collisions
    sbConfig.set_collisions(0x11)

    // Friction
    // sbConfig.set_kDF(0.1)
    // // Damping
    // sbConfig.set_kDP(0.1)
    // Pressure
    sbConfig.set_kPR(pressure)
    // Stiffness
    volumeSoftBody.get_m_materials().at(0).set_m_kLST(0.09)
    volumeSoftBody.get_m_materials().at(0).set_m_kAST(0.09)

    volumeSoftBody.setTotalMass(mass, false)

    // adjust position to mesh
    const pos = _child.position.clone()
    volumeSoftBody.translate(new Ammo.btVector3(pos.x, pos.y, pos.z))
    _child.position.set(0, 0, 0)

    // @ts-ignore
    Ammo.castObject(volumeSoftBody, Ammo.btCollisionObject).getCollisionShape().setMargin(margin)

    // this.physics.physicsWorld.addSoftBody(volumeSoftBody, 1, -1)

    this.physics.addSoftBodyToWorld(object as any, volumeSoftBody)
    // // Disable deactivation
    volumeSoftBody.setActivationState(4)

    // volumeSoftBody.random

    // volumeSoftBody.get_m_nodes().at(0).set
  }

  async create() {
    // this.physics.debug?.enable()
    // this.physics.debug?.mode(2)

    this.warpSpeed('-ground')

    const ground = this.physics.add.ground({ y: -5, width: 40, height: 40 })
    ground.body.setRestitution(1)
    this.camera.position.set(5, 5, 10)
    this.camera.lookAt(0, 0, 0)

    const addCube = async (x: number, mass: number, pressure: number) => {
      const gltf = await this.load.gltf('cube')
      this.cube = gltf.scene.children[0]

      const c = this.cube.clone(true)

      const texture = await this.load.texture('/assets/colors.png')

      c.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = child.receiveShadow = false

          child.material.metalness = 0
          child.material.roughness = 1
          child.material.opacity = 0.8
          // child.material.transparent = true

          // child.material = new MeshPhongMaterial({ color: 'red' })
          // child.material.needsUpdate = true

          child.material.map = texture
          child.material.needsUpdate = true
        }
      })

      c.position.y += 0.5
      c.position.x = x

      this.scene.add(c)
      this.addSoftBody(c, mass, pressure)
    }

    addCube(-3, 10, 100)
    addCube(0, 50, 800)
    addCube(3, 100, 2000)

    setTimeout(() => {
      new Array(15).fill(null).forEach((a, i) => {
        const ball = this.physics.add.sphere({ x: i - 7, y: 10, radius: 0.5, mass: 4 })
        ball.body.setBounciness(0.5)
      })
    }, 1000)
  }

  update(time: number) {
    return
    if (time < 2) {
      this.pilar.bone.bones[1].rotation.y -= Math.PI / 2 / 120
      this.pilar.bone.bones[2].rotation.y -= Math.PI / 2 / 120
      this.pilar.bone.bones[2].rotation.z -= Math.PI / 2 / 250
    }

    if (time > 2 && time < 4) {
      this.pilar.bone.bones[1].rotation.y += Math.PI / 2 / 120
      this.pilar.bone.bones[2].rotation.y += Math.PI / 2 / 120
      this.pilar.bone.bones[2].rotation.z += Math.PI / 2 / 250
    }

    if (time > 4 && time < 6) {
      this.pilar.bone.bones[0].rotation.z += Math.PI / 2 / 256
      this.pilar.bone.bones[1].rotation.z += Math.PI / 2 / 256
      this.pilar.bone.bones[2].rotation.z += Math.PI / 2 / 256
    }

    if (time > 7 && time < 7.2) {
      this.pilar.bone.bones[0].rotation.z -= Math.PI / 2 / 16
      this.pilar.bone.bones[1].rotation.z -= Math.PI / 2 / 16
      this.pilar.bone.bones[2].rotation.z -= Math.PI / 2 / 32
    }
  }
}

const startProject = () => {
  PhysicsLoader(
    '/lib/kripken',
    () => new Project({ scenes: [MainScene], softBodies: true, maxSubSteps: 4, fixedTimeStep: 1 / 120 })
  )
}

export default startProject
