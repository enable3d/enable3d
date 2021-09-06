btSoftBody *PhysicsManager::addSoftBodyMesh(int numAllVertices, float *allVerts, int numTriangles, int *indices, btVector3 position, float mass)
{

    int maxidx = 0;
    int i, j, ni;

    for (i = 0, ni = numTriangles * 3; i < ni; ++i)
    {
        maxidx = btMax((int)indices, maxidx);
    } /*qDebug() << "2";*/
    ++maxidx;
    btAlignedObjectArray<bool> chks;
    btAlignedObjectArray<btVector3> vtx;
    chks.resize(maxidx * maxidx, false);
    vtx.resize(maxidx);
    for (i = 0, j = 0, ni = maxidx * 3; i < ni; ++j, i += 3)
    {
        vtx[j] = btVector3(allVerts, allVerts[i + 1], allVerts[i + 2]);
        btSoftBody *psb = new btSoftBody(&m_softBodyWorldInfo, vtx.size(), &vtx[0], 0);
        for (i = 0, ni = /*numIndices*/ numTriangles * 3; i < ni; i += 3)
        {
            const int idx[] = {indices, indices[i + 1], indices[i + 2]};
#define IDX(_x_, _y_) ((_y_)*maxidx + (_x_))
            for (int j = 2, k = 0; k < 3; j = k++)
            {
                if (!chks[IDX(idx[j], idx[k])])
                {
                    chks[IDX(idx[j], idx[k])] = true;
                    chks[IDX(idx[k], idx[j])] = true;
                    psb->appendLink(idx[j], idx[k]);
                }
            }
#undef IDX
            psb->appendFace(idx[0], idx[1], idx[2]);
        }

        // psb->setMass( 100, 0); psb->setMass( 120, 0); psb->setMass( 200, 0); psb->setMass( 300, 0);
        btSoftBody::Material *pm = psb->appendMaterial();
        pm->m_kLST = 0.3;
        pm->m_kAST = 0.2;
        pm->m_kVST = 0.5;

        psb->generateBendingConstraints(2, pm);
        psb->m_cfg.piterations = 7;
        psb->m_cfg.collisions = btSoftBody::fCollision::SDF_RS + btSoftBody::fCollision::CL_SS + btSoftBody::fCollision::CL_SELF;

        psb->m_cfg.kDF = 1.0;
        psb->randomizeConstraints();
        btTransform trans;
        trans.setIdentity();
        trans.setOrigin(position);
        psb->transform(trans);
        psb->setTotalMass(1.5, true);
        psb->generateClusters(8);

        m_world->addSoftBody(psb);

        return psb;
    }