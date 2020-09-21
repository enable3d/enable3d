
// adapted from https://github.com/mrdoob/three.js/blob/master/examples/webgl_worker_offscreencanvas.html

import initJank from './jank.js';
import init from './scene.js';

import { PhysicsLoader } from 'enable3d'

PhysicsLoader('/lib', () => {
    
    var canvas1 = document.getElementById( 'canvas1' );
    var canvas2 = document.getElementById( 'canvas2' );
    
    var width = canvas1.clientWidth;
    var height = canvas1.clientHeight;
    var pixelRatio = window.devicePixelRatio;
    
    // load on screen canvas
    
    init( canvas1, width, height, pixelRatio);
    initJank();

    // load off screen canvas

    if ( 'transferControlToOffscreen' in canvas2 ) {

        var offscreen = canvas2.transferControlToOffscreen();
        var worker = new Worker( 'worker.js', { type: 'module' } );
        worker.postMessage( {
            canvas: offscreen,
            width: canvas2.clientWidth,
            height: canvas2.clientHeight,
            pixelRatio: window.devicePixelRatio,
        }, [ offscreen ] );

    } else {

        document.getElementById( 'message' ).style.display = 'block';

    }
})