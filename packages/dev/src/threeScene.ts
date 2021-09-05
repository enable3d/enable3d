import { ExtendedObject3D, PhysicsLoader, Project, Scene3D, THREE } from 'enable3d'

import * as PKG from 'three/examples/jsm/utils/BufferGeometryUtils'
const { BufferGeometryUtils } = PKG

interface TypeBufferGeometry extends THREE.BufferGeometry {
  index: any
  ammoVertices: number[]
  ammoIndices: number[]
  ammoIndexAssociation: any
}

class MainScene extends Scene3D {
  hand: any

  isEqual(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) {
    const delta = 0.000001
    return Math.abs(x2 - x1) < delta && Math.abs(y2 - y1) < delta && Math.abs(z2 - z1) < delta
  }

  processGeometry(bufGeometry: THREE.BufferGeometry) {
    // Ony consider the position values when merging the vertices
    const posOnlyBufGeometry = new THREE.BufferGeometry()
    posOnlyBufGeometry.setAttribute('position', bufGeometry.getAttribute('position'))
    posOnlyBufGeometry.setIndex(bufGeometry.getIndex())

    // Merge the vertices so the triangle soup is converted to indexed triangles
    // @ts-ignore
    const indexedBufferGeom = BufferGeometryUtils.mergeVertices(posOnlyBufGeometry)

    // Create index arrays mapping the indexed vertices to bufGeometry vertices
    this.mapIndices(bufGeometry as any, indexedBufferGeom as any)
    // @ts-ignore
    // console.log('bufGeometry.ammoIndexAssociation', bufGeometry.ammoIndexAssociation)
  }

  mapIndices(bufGeometry: TypeBufferGeometry, indexedBufferGeom: TypeBufferGeometry) {
    // Creates ammoVertices, ammoIndices and ammoIndexAssociation in bufGeometry

    const vertices = bufGeometry.attributes.position.array
    const idxVertices = indexedBufferGeom.attributes.position.array as any
    const indices = indexedBufferGeom.index.array

    const numIdxVertices = idxVertices.length / 3
    const numVertices = vertices.length / 3

    bufGeometry.ammoVertices = idxVertices
    bufGeometry.ammoIndices = indices
    bufGeometry.ammoIndexAssociation = []

    console.log(numIdxVertices)

    for (let i = 0; i < numIdxVertices; i++) {
      const association: any = []
      bufGeometry.ammoIndexAssociation.push(association)

      const i3 = i * 3

      for (let j = 0; j < numVertices; j++) {
        const j3 = j * 3
        if (
          // eslint-disable-next-line no-constant-condition

          this.isEqual(
            idxVertices[i3],
            idxVertices[i3 + 1],
            idxVertices[i3 + 2],
            vertices[j3],
            vertices[j3 + 1],
            vertices[j3 + 2]
          )
        ) {
          association.push(j3)
        }
      }
    }

    // console.log('bufGeometry.ammoIndexAssociation', bufGeometry.ammoIndexAssociation)
  }

  addSoftBody(object: any, bufferGeom: TypeBufferGeometry, mass: number = 50, pressure: number = 50, margin = 0.05) {
    this.processGeometry(bufferGeom)

    const softBodyHelpers = new Ammo.btSoftBodyHelpers()
    const volumeSoftBody = softBodyHelpers.CreateFromTriMesh(
      this.physics.physicsWorld.getWorldInfo(),
      bufferGeom.ammoVertices,
      bufferGeom.ammoIndices,
      bufferGeom.ammoIndices.length / 3,
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

    const totalNodes = volumeSoftBody.get_m_nodes().size()

    // for (let i = 0; i < totalNodes; i++) {
    //   volumeSoftBody.setMass(i, 0)
    // }

    // volume.userData.physicsBody = volumeSoftBody

    // softBodies.push(volume)
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
    this.addSoftBody(this.hand.skinned_mesh, this.hand.skinned_mesh.geometry)
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
