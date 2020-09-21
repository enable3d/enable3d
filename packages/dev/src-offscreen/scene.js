import { Project, Scene3D, THREE } from 'enable3d'

class MainScene extends Scene3D {
  constructor()
  {
      super({ key: 'MainScene'})
  }
  
  async create() {
    this.warpSpeed()
    this.camera.position.set(2, 2, 4)

    var geometry = new THREE.SphereBufferGeometry( 5, 3 );
    geometry.scale(0.001, 0.001, 0.001)

    for ( var i = 0; i < 100; i ++ ) {

      var material = new THREE.MeshStandardMaterial({ color: new THREE.Color(random())})
      var mesh = new THREE.Mesh( geometry, material );
      mesh.position.x = random() * 8 - 4;
      mesh.position.y = random() * 8;
      mesh.position.z = random() * 8 - 4;
      mesh.scale.setScalar( random() + 1 );
      this.scene.add( mesh );
      this.physics.add.existing(mesh)

    }
  }
}

var seed = 1;

function random() {

	var x = Math.sin( seed ++ ) * 10000;

	return x - Math.floor( x );

}
export default function (canvas, width, height, pixelRatio  ) {
  
    const project = new Project({ 
      renderer: new THREE.WebGLRenderer({ antialias: true, canvas: canvas }),
      scenes: [MainScene] 
    })

    const mainScene = project.scenes.get('MainScene')

    mainScene.camera.aspect = width / height
    mainScene.camera.updateProjectionMatrix()

    mainScene.renderer.setPixelRatio(devicePixelRatio)
    mainScene.renderer.setSize(width, height)
}
