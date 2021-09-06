import { ExtendedObject3D, PhysicsLoader, Project, Scene3D, THREE } from 'enable3d'

import { TypeBufferGeometry, processGeometry } from '@enable3d/ammo-physics/dist/tmp'
import { Material, Object3D, Quaternion, SkinnedMesh, Vector3 } from 'three'
import { Vector } from 'matter'

const IS_SOFT = false

class MainScene extends Scene3D {
  pilar: {
    object3D: Object3D
    mesh: SkinnedMesh
    bone: THREE.Skeleton
  }

  addSoftBody(object: Object3D, mass: number = 10, pressure: number = 1000, margin = 0.05) {
    let _child!: THREE.Mesh
    object.traverse((child: any) => {
      if (child.isMesh) {
        _child = child
      }
    })

    const geometry = _child.geometry as TypeBufferGeometry
    console.log('geo', geometry)
    processGeometry(geometry)

    const softBodyHelpers = new Ammo.btSoftBodyHelpers()
    const volumeSoftBody = softBodyHelpers.CreateFromTriMesh(
      this.physics.physicsWorld.getWorldInfo(),
      geometry.ammoVertices,
      geometry.ammoIndices,
      geometry.ammoIndices.length / 3,
      false // true
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

    console.log('bla')

    // this.physics.physicsWorld.addSoftBody(volumeSoftBody, 1, -1)

    this.physics.addSoftBodyToWorld(object as any, volumeSoftBody)
    // // Disable deactivation
    volumeSoftBody.setActivationState(4)
  }

  async create() {
    this.physics.debug?.enable()

    this.warpSpeed('-ground')

    this.physics.add.ground({ y: -10, width: 40, height: 40 })
    this.camera.position.set(20, 20, 40)
    this.camera.lookAt(0, 0, 0)

    const gltf = await this.load.gltf('/assets/pilar.glb')

    const pilar = gltf.scene.children[0]

    this.pilar = {
      object3D: pilar,
      mesh: pilar.children[1] as SkinnedMesh,
      bone: (pilar.children[1] as SkinnedMesh).skeleton
    }

    console.log(this.pilar)

    // Object3D.position.y = 12
    let _child: any
    this.pilar.object3D.traverse((child: any) => {
      if (child.isMesh) {
        _child = child
        child.castShadow = child.receiveShadow = false
        child.material.metalness = 0
        child.material.roughness = 1
        child.material.opacity = 0.5
        child.material.transparent = true
      }
    })

    let bufferGeometry: any

    this.pilar.object3D.position.y += 5
    // this.pilar.position.x += 15
    // this.pilar.rotation.z = Math.PI / 2
    // this.pilar.rotation.x = -Math.PI / 2
    this.scene.add(this.pilar.object3D)
    this.scene.add(new THREE.SkeletonHelper(this.pilar.object3D))

    // this.addSoftBody(this.hand.Object3D, bufferGeometry)
    this.addSoftBody(this.pilar.mesh)

    // if (!IS_SOFT) {
    //   hand.skeleton.bones.forEach((b: any) => {
    //     if (!/3$/.test(b.name)) {
    //       this.physics.add.existing(b, {
    //         collisionFlags: 2,
    //         shape: 'capsule',
    //         height: 0.9,
    //         radius: 0.4,
    //         axis: 'x',
    //         offset: { y: 0 }
    //         // orientation: new Quaternion(1, 1, 1, 1)
    //       })
    //       // we update the body manually
    //       b.body.skipUpdate = true
    //     }
    //   })
    // }

    // if (IS_SOFT) {
    //   // this.addSoftBody(this.hand.Object3D, bufferGeometry)
    //   this.addSoftBody(this.hand.skinned_mesh)

    //   console.log(this.hand.skeleton.bones)
    // }

    setTimeout(() => {
      // this.physics.add.box({ x: 0, y: 15, width: 5, height: 5, depth: 5, mass: 100 })
    }, 1000)

    // this.physics.add.existing(this.hand.Object3D as any, { shape: 'convex', collisionFlags: 2 })
  }

  update(time: number) {
    // this.hand.Object3D.position.x -= 0.05
    // this.hand.palm.rotation.y += Math.PI / 2 / 200
    // return
    if (time < 2) this.pilar.bone.bones[1].rotation.z += Math.PI / 2 / 256

    if (time > 2 && time < 4) this.pilar.bone.bones[2].rotation.y += Math.PI / 2 / 256

    return
    if (time > 3 && time < 7) {
      this.hand.index.forEach((b: any) => (b.rotation.z += Math.PI / 2 / 256))
      this.hand.pinky.forEach((b: any) => (b.rotation.z += Math.PI / 2 / 256))
      this.hand.ring.forEach((b: any) => (b.rotation.z += Math.PI / 2 / 256))
      this.hand.middle.forEach((b: any) => (b.rotation.z += Math.PI / 2 / 256))
    }

    if (time > 7 && time < 13) {
      this.hand.position.x -= 0.02
      this.hand.rotation.z += 0.0005
    }

    if (time > 15 && time < 15.07) {
      this.hand.index.forEach((b: any) => (b.rotation.z -= Math.PI / 2 / 4))
    }

    // this.hand.forearm.rotation.y += Math.PI / 2 / 128
    this.hand.skeleton.bones.forEach((b: SkinnedMesh, i: number) => {
      // @ts-ignore
      if (!b.body) return

      if (!IS_SOFT) {
        b.updateMatrix()
        b.updateMatrixWorld()

        const v = new THREE.Vector3(1, 0, 1)
        v.applyEuler(b.rotation)

        const e = new THREE.Euler()
          .setFromRotationMatrix(b.matrixWorld)
          .toVector3()
          .add(this.hand.skinned_mesh.rotation.toVector3())

        const pos = new THREE.Vector3().setFromMatrixPosition(b.matrixWorld).add(this.hand.skinned_mesh.position)
        const rot = e // new THREE.Vector3().add(b.rotation.toVector3())

        // @ts-ignore
        const { offset: o } = b.body

        // const pos = new Vector3(b.x, b.y, b.z).applyMatrix4(objThree.matrixWorld)
        // const normal = new Vector3(nx, ny, nz).applyMatrix4(objThree.matrixWorld)
        // b.position.copy(pos)
        // @ts-ignore
        b.body.transform()
        // @ts-ignore
        b.body.setPosition(pos.x + o.x, pos.y + o.y, pos.z + o.z)
        // @ts-ignore
        b.body.setRotation(rot.x, rot.y, rot.z)
        // @ts-ignore
        b.body.refresh()
        // @ts-ignore
        // b.body.needUpdate = true
      }
    })
  }
}

const startProject = () => {
  PhysicsLoader('/lib/kripken', () => new Project({ scenes: [MainScene], softBodies: true }))
}

export default startProject
