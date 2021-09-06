import { PhysicsLoader, Project, Scene3D, THREE } from 'enable3d'

import { TypeBufferGeometry, processGeometry } from './tmp'
import { Object3D, SkinnedMesh } from 'three'

class MainScene extends Scene3D {
  pilar: {
    object3D: Object3D
    mesh: SkinnedMesh
    bone: THREE.Skeleton
  }

  addSoftBody(object: Object3D, mass: number = 100, pressure: number = 1000, margin = 0.05) {
    let _child!: THREE.Mesh
    object.traverse((child: any) => {
      if (child.isMesh) {
        _child = child
      }
    })

    const geometry = _child.geometry as TypeBufferGeometry

    processGeometry(geometry)

    const softBodyHelpers = new Ammo.btSoftBodyHelpers()
    const volumeSoftBody = softBodyHelpers.CreateFromTriMesh(
      this.physics.physicsWorld.getWorldInfo(),
      geometry.ammoVertices,
      geometry.ammoIndices,
      geometry.ammoIndices.length / 3,
      true // true
    )

    const sbConfig = volumeSoftBody.get_m_cfg()
    sbConfig.set_viterations(40)
    sbConfig.set_piterations(40)

    // Soft-soft and soft-rigid collisions
    sbConfig.set_collisions(0x11)

    // Friction
    sbConfig.set_kDF(0.1)
    // Damping
    sbConfig.set_kDP(0.1)
    // Pressure
    sbConfig.set_kPR(pressure)
    // Stiffness
    volumeSoftBody.get_m_materials().at(0).set_m_kLST(0.09)
    volumeSoftBody.get_m_materials().at(0).set_m_kAST(0.09)

    volumeSoftBody.setTotalMass(mass, false)
    // @ts-ignore
    Ammo.castObject(volumeSoftBody, Ammo.btCollisionObject).getCollisionShape().setMargin(margin)

    // this.physics.physicsWorld.addSoftBody(volumeSoftBody, 1, -1)

    this.physics.addSoftBodyToWorld(object as any, volumeSoftBody)
    // // Disable deactivation
    volumeSoftBody.setActivationState(4)
  }

  async create() {
    this.physics.debug?.enable()

    this.warpSpeed('-ground')

    const ground = this.physics.add.ground({ y: -10, width: 40, height: 40 })
    ground.body.setRestitution(1)
    this.camera.position.set(5, 5, 10)
    this.camera.lookAt(0, 0, 0)

    const gltf = await this.load.gltf('/assets/pilar.glb')

    const pilar = gltf.scene.children[0]

    pilar.rotateZ(Math.PI)
    pilar.position.setY(-6)
    pilar.position.setX(3)

    this.pilar = {
      object3D: pilar,
      mesh: pilar.children[1] as SkinnedMesh,
      bone: (pilar.children[1] as SkinnedMesh).skeleton
    }

    this.pilar.object3D.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = child.receiveShadow = false
        child.material.metalness = 0
        child.material.roughness = 1
        child.material.opacity = 0.5
        child.material.transparent = true
      }
    })

    this.pilar.object3D.position.y += 5

    this.scene.add(this.pilar.object3D)
    this.scene.add(new THREE.SkeletonHelper(this.pilar.object3D))

    this.addSoftBody(this.pilar.mesh)

    setTimeout(() => {
      const ball = this.physics.add.sphere({ x: 0, y: 15, radius: 1.5, mass: 1 })
      ball.body.setBounciness(0.5)
    }, 3000)
  }

  update(time: number) {
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
  PhysicsLoader('/lib/kripken', () => new Project({ scenes: [MainScene], softBodies: true }))
}

export default startProject
