import { PhysicsLoader, Project, Scene3D, THREE } from 'enable3d'

import { TypeBufferGeometry, processGeometry } from './tmp'
import { Object3D, SkinnedMesh } from 'three'

class MainScene extends Scene3D {
  pilar: {
    object3D: Object3D
    mesh: SkinnedMesh
    bone: THREE.Skeleton
  }
  async create() {
    this.physics.debug?.enable()
    this.physics.debug?.mode(3)

    const { orbitControls } = await this.warpSpeed('-ground')

    orbitControls?.target.set(0, -5, 0)

    const ground = this.physics.add.ground({ y: -10, width: 40, height: 40 })
    ground.body.setRestitution(1)
    this.camera.position.set(5, 5, 10)
    this.camera.lookAt(0, -5, 0)

    const gltf = await this.load.gltf('/assets/pilar.glb')

    const pilar = gltf.scene.children[0]

    // pilar.rotateZ(Math.PI)
    // pilar.position.setY(-6)
    // pilar.position.setX(3)

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

    // this.pilar.object3D.position.y += 5

    this.scene.add(this.pilar.object3D)
    this.scene.add(new THREE.SkeletonHelper(this.pilar.object3D))
    this.addSoftBody(this.pilar.object3D, 100, 500)

    // this.pilar.object3D.body.ammo.setGravity(new Ammo.btVector3().setValue(0, 0, 0))

    const addBall = (x: number) => {
      const ball = this.physics.add.sphere({ x, y: 7, radius: 0.7, mass: 1 })
      ball.body.setBounciness(0.5)
    }

    setTimeout(() => {
      addBall(0)
      addBall(2)
      addBall(4)
      addBall(6)
      addBall(7)
    }, 2000)
  }

  addSoftBody(object: Object3D, mass: number = 100, pressure: number = 1000, margin = 0.05) {
    let _child!: THREE.Mesh
    object.traverse((child: any) => {
      if (child.isMesh) {
        _child = child
      }
    })

    console.log(object)

    const { geometry } = object.children[1] as any

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
    // sbConfig.set_viterations(40)
    // sbConfig.set_piterations(40)

    // Soft-soft and soft-rigid collisions
    sbConfig.set_collisions(0x11)

    // Friction
    // sbConfig.set_kDF(0.1)
    // Damping
    // sbConfig.set_kDP(0.1)
    // Pressure
    sbConfig.set_kPR(pressure)

    // sbConfig.set_kSRHR_CL(1)

    // Stiffness
    // volumeSoftBody.get_m_materials().at(0).set_m_kLST(0.09)
    // volumeSoftBody.get_m_materials().at(0).set_m_kAST(0.09)

    volumeSoftBody.setTotalMass(mass, false)
    // @ts-ignore
    Ammo.castObject(volumeSoftBody, Ammo.btCollisionObject).getCollisionShape().setMargin(margin)

    // set mass to zero for each node (like kinematic !?)
    for (let i = 0; i < volumeSoftBody.get_m_nodes().size(); i++) volumeSoftBody.get_m_nodes().at(i).set_m_im(0)

    // this.physics.physicsWorld.addSoftBody(volumeSoftBody, 1, -1)

    this.physics.addSoftBodyToWorld(object as any, volumeSoftBody)

    // @ts-ignore

    // volumeSoftBody.setCollisionFlags(0x11)

    // // Disable deactivation
    volumeSoftBody.setActivationState(4)
  }

  update(time: number) {
    if (time < 3) {
      this.pilar.bone.bones[2].rotation.z -= Math.PI / 2 / 500
      this.pilar.bone.bones[1].rotation.z -= Math.PI / 2 / 500
      this.pilar.bone.bones[0].rotation.z -= Math.PI / 2 / 500

      this.pilar.object3D.rotation.z -= 0.005
      // this.pilar.bone.bones[1].position.x += 0.05
      // this.pilar.bone.bones[2].position.x += 0.05
      // this.pilar.bone.bones[2].position.x += 0.03
      // this.pilar.bone.bones[1].position.x += 0.03
      // this.pilar.object3D.position.x -= 0.05
      // this.pilar.bone.bones[2].position.x += 0.05
      // this.pilar.bone.bones[0].position.x -=s0.05
      // this.pilar.bone.bones[2].rotation.y -= Math.PI / 2 / 120
    }

    // if (time > 3 && time < 5) {
    //   this.pilar.bone.bones[1].rotation.y += Math.PI / 2 / 250
    //   this.pilar.bone.bones[2].rotation.y += Math.PI / 2 / 250
    // }

    // if (time > 5) {
    // }
    return

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
