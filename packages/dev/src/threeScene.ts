import { ExtendedObject3D, PhysicsLoader, Project, Scene3D, THREE } from 'enable3d'

import { TypeBufferGeometry, processGeometry } from '@enable3d/ammo-physics/dist/tmp'

class MainScene extends Scene3D {
  hand: any

  addSoftBody(object: any, mass: number = 50, pressure: number = 50, margin = 0.05) {
    const geometry = object.geometry as TypeBufferGeometry
    processGeometry(geometry)

    const softBodyHelpers = new Ammo.btSoftBodyHelpers()
    const volumeSoftBody = softBodyHelpers.CreateFromTriMesh(
      this.physics.physicsWorld.getWorldInfo(),
      geometry.ammoVertices,
      geometry.ammoIndices,
      geometry.ammoIndices.length / 3,
      true
    )

    const sbConfig = volumeSoftBody.get_m_cfg()
    sbConfig.set_viterations(40)
    sbConfig.set_piterations(40)

    // Soft-soft and soft-rigid collisions
    sbConfig.set_collisions(0x11)

    // Friction
    sbConfig.set_kDF(0.1)
    // Damping
    sbConfig.set_kDP(0.01)
    // Pressure
    sbConfig.set_kPR(pressure)
    // Stiffness
    volumeSoftBody.get_m_materials().at(0).set_m_kLST(0.9)
    volumeSoftBody.get_m_materials().at(0).set_m_kAST(0.9)

    volumeSoftBody.setTotalMass(mass, false)
    // @ts-ignore
    Ammo.castObject(volumeSoftBody, Ammo.btCollisionObject).getCollisionShape().setMargin(margin)

    this.physics.physicsWorld.addSoftBody(volumeSoftBody, 1, -1)

    this.physics.addSoftBodyToWorld(object, volumeSoftBody)
    // Disable deactivation
    volumeSoftBody.setActivationState(4)
  }

  async create() {
    this.physics.debug?.enable()

    this.warpSpeed('-ground')

    this.physics.add.ground({ y: -20, width: 40, height: 40 })
    this.camera.position.set(20, 20, 40)
    this.camera.lookAt(0, 0, 0)

    const gltf = await this.load.gltf('/assets/hand.glb')
    const Object3D = gltf.scene.children[0]
    // Object3D.position.y = 12

    const hand: any = {
      Object3D: Object3D,
      skinned_mesh: Object3D.children[1],
      // @ts-expect-error
      skeleton: Object3D.children[1].skeleton,
      position: Object3D.position,
      rotation: Object3D.rotation,
      quaternion: Object3D.quaternion
    }

    const bones = hand.skeleton.bones
    hand.forearm = bones[0]
    hand.wrist = bones[1]
    hand.palm = bones[2]
    hand.thumb = bones.slice(3, 7)
    hand.index = bones.slice(7, 11)
    hand.middle = bones.slice(11, 15)
    hand.ring = bones.slice(15, 19)
    hand.pinky = bones.slice(19, 23)

    this.hand = hand

    let bufferGeometry: any

    this.hand.Object3D.traverse((child: any) => {
      if (child.isMesh) {
        bufferGeometry = child.geometry
        console.log('child')
        child.castShadow = child.receiveShadow = false
        child.material.metalness = 0
        child.material.roughness = 1
      }
    })

    this.scene.add(this.hand.Object3D)
    this.scene.add(new THREE.SkeletonHelper(this.hand.Object3D))

    // this.addSoftBody(this.hand.Object3D, bufferGeometry)
    this.addSoftBody(this.hand.skinned_mesh)
    console.log(this.hand.skeleton)

    const interval = setInterval(() => {
      this.hand.Object3D.position.x += 0.1
      this.hand.palm.rotation.y += Math.PI / 2 / 128
      // this.hand.forearm.rotation.y += Math.PI / 2 / 128
    }, 100)

    setTimeout(() => {
      clearInterval(interval)
    }, 100 * 128)

    // this.physics.add.existing(this.hand.Object3D as any, { shape: 'convex', collisionFlags: 2 })
  }
}

const startProject = () => {
  PhysicsLoader('/lib/kripken', () => new Project({ scenes: [MainScene], softBodies: true }))
}

export default startProject
