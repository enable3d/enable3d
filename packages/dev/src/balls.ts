import { PhysicsLoader, Project, Scene3D, THREE } from 'enable3d'

import { TypeBufferGeometry, processGeometry } from './tmp'
import { Object3D, SkinnedMesh } from 'three'

class MainScene extends Scene3D {
  pilar: {
    object3D: Object3D
    mesh: SkinnedMesh
    bone: THREE.Skeleton
  }

  addSoftBody(object: Object3D, mass: number = 1, pressure: number = 200, margin = 0.04) {
    let _child = object as any

    // pm->m_kLST				=	0.5;
    // pm->m_flags				-=	btSoftBody::fMaterial::DebugDraw;
    // psb->generateBendingConstraints(2,pm);
    // psb->m_cfg.piterations	=	20;
    // psb->m_cfg.kDF			=	0.5;
    // psb->randomizeConstraints();
    // psb->m_cfg.collisions	=	btSoftBody::fCollision::CL_SS+ btSoftBody::fCollision::CL_RS;
    // psb->rotate(btQuaternion(0.70711,0,0,0.70711));
    // psb->translate(btVector3(-0.05,0,1.0));
    // psb->scale(btVector3(0.05,0.05,0.05));
    // psb->setTotalMass(0.1,true);
    // psb->getCollisionShape()->setMargin(0.01);
    // psb->generateClusters(1);
    // psb->m_cfg.kDF	=	0.99;

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
    sbConfig.set_viterations(20)
    sbConfig.set_piterations(20)

    // Soft-soft and soft-rigid collisions
    sbConfig.set_collisions(0x11)

    // console.log(sbConfig.get_timescale())
    // sbConfig.set_timescale(2.5)

    // Friction
    // sbConfig.set_kDF(0.1)
    // Damping
    // sbConfig.set_kDP(0.0001)
    // Pressure
    sbConfig.set_kPR(pressure * mass)
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

    this.physics.addSoftBodyToWorld(object as any, volumeSoftBody)
    // // Disable deactivation
    volumeSoftBody.setActivationState(4)
  }

  async create() {
    this.physics.debug?.enable()

    this.warpSpeed('-ground')

    const ground = this.physics.add.ground({ y: -1, width: 40, height: 40 })
    ground.body.setRestitution(1)
    // this.camera.position.set(5, 5, 10)
    this.camera.lookAt(0, 0, 0)

    const addBall = (x: number, y: number, mass: number, pressure: number, segments: [number, number]) => {
      const b = this.add.sphere({ x, y, widthSegments: segments[0], heightSegments: segments[1] }) as any
      // b.translate(0, 5, 0)
      // this.add.existing(b)
      this.addSoftBody(b, mass, pressure)
    }

    this.physics.add.sphere({ x: 3, y: 3 })
    addBall(-3, 3, 2, 50, [12, 8])
    addBall(0, 3, 1, 50, [16, 16])

    setTimeout(() => {
      const radius = 0.5
      this.physics.add.sphere({ x: -3, y: 6, radius })
      this.physics.add.sphere({ x: 0, y: 6, radius })
    }, 1500)
  }
}

const startProject = () => {
  PhysicsLoader(
    '/lib/kripken',
    () => new Project({ scenes: [MainScene], softBodies: true, maxSubSteps: 4, fixedTimeStep: 1 / 120 })
  )
}

export default startProject
