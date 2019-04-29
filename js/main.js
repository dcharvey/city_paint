// threejs
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats, controls;
var camera, scene, renderer;
var clock = new THREE.Clock();
var mixers = [];
var plane;
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2(-10, -10);
var mode = 'density'
var brushSize = 200;
var brushIntensity = 10;
var brushFeathering = 1;
var brushPercCoverage = 50;
var selectedUse = 'residential'
var useTypes = ['residential','office','retail','park']
var mouseDown = false;

init();

function init() {

  container = document.getElementById( 'scene-viewer' );
  document.body.appendChild( container );

  // scene
  scene = new THREE.Scene();

  var ambient = new THREE.AmbientLight( 0xe8ecff, 1.4 );
  ambient.name = "ambientLight"
  scene.add( ambient );

  var directionalLight1 = new THREE.DirectionalLight( 0xfff1f1, .7);
  directionalLight1.name = "directionalLight1";
  directionalLight1.position.set( -2000, 1200, 2000 );
  directionalLight1.castShadow = true;
  scene.add( directionalLight1 );

  directionalLight1.shadow.camera.right =  2000;
  directionalLight1.shadow.camera.left = -2000;
  directionalLight1.shadow.camera.top=  2000;
  directionalLight1.shadow.camera.bottom = -2000;
  directionalLight1.shadow.camera.near = 0;
  directionalLight1.shadow.camera.far = 10000;

  var axesHelper = new THREE.AxesHelper( 100 );
  scene.add( axesHelper );

  var shadowCameraHelper = new THREE.CameraHelper(directionalLight1.shadow.camera);
  shadowCameraHelper.visible = false;
  shadowCameraHelper.name = "directionalLight1Helper"
  scene.add( shadowCameraHelper );

  var directionalLight2 = new THREE.DirectionalLight( 0x87c0ff, .2);
  directionalLight2.name = "directionalLight2"
  directionalLight2.position.set( 1, 1, -1 );
  scene.add( directionalLight2 );


  //
  // var geometry = new THREE.BoxGeometry( 100, 100, 100 );
  // var material = new THREE.MeshStandardMaterial();
  // material.color = new THREE.Color( 0x00ff00 );
  // material.roughness = 0
  // var cube = new THREE.Mesh( geometry, material );
  // cube.castShadow = true;
  // cube.receiveShadow = true;
  // scene.add( cube );

  console.log(scene)

  // set up renderer
  renderer = new THREE.WebGLRenderer( { antialias:true });
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( (window.innerWidth), window.innerHeight );
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene.background = new THREE.Color( 0x1a2050 );
  scene.fog = new THREE.Fog( 0x1a2050, 10000, 10000);

  container.appendChild( renderer.domElement );

  // set up camera and controls
  camera = new THREE.PerspectiveCamera( 45, (window.innerWidth) / window.innerHeight, 20, 15000 );
  camera.position.set( -1000, 1500, 1000 );

  controls = new THREE.OrbitControls( camera, renderer.domElement );
  controls.target.set( 0, 0, 0 );
  controls.maxDistance = 4000;
  controls.enablePan = false;
  controls.mouseButtons.ORBIT = 2;
  controls.mouseButtons.PAN = 0;
  controls.mouseButtons.ZOOM = 1;
  controls.update();

  window.addEventListener( 'resize', onWindowResize, false );

  animate();

}



function onWindowResize() {

  camera.aspect = (window.innerWidth) / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( (window.innerWidth), window.innerHeight );

}

//

function animate() {

  requestAnimationFrame( animate );

  if ( mixers.length > 0 ) {

    for ( var i = 0; i < mixers.length; i ++ ) {

      mixers[ i ].update( clock.getDelta() );

    }

  }

  render();

  //UPDATE TWEEN
  TWEEN.update();
  controls.update();

  // console.log(camera.position)
}

var dir = new THREE.Vector3( 0, 10, 0 );
var length = 1;
var hex = 0xffff00;

var yellow2blue = chroma.scale(['#fde0dd', '#fa9fb5', '#c51b8a']).domain([0,100]);
var useColors = {'residential':'#fff400', 'office':'#df5343', 'retail':'#f99653', 'park':'#69f953'}

//normalize the direction vector (convert to vector of length 1)
dir.normalize();

var group = new THREE.Group();
group.name = 'pixelMap'

var pixelSize = 100;
var pixelsX = 20, pixelsZ = 20;


for (var i=0; i<pixelsX; i++) {
  for (var j=0; j<pixelsZ; j++) {

    // add the pixel
    var geometry = new THREE.PlaneGeometry( pixelSize, pixelSize );

    var material = new THREE.MeshStandardMaterial( {color: 0x000000, roughness: 1, metalness: .5, side: 0} );
    material.wireframe = false;

    var plane = new THREE.Mesh( geometry, material );
    plane.name = 'pixel_' + i + j;
    plane.castShadow = true;
    plane.receiveShadow = true;
    plane.rotation.x = - Math.PI / 2;
    plane.position.set(i * pixelSize + (pixelSize / 2) - ((pixelsX * pixelSize) / 2), 0 , j * pixelSize + (pixelSize / 2) - ((pixelsZ * pixelSize) / 2))
    plane.userData = { 'density':i + j, 'use':useTypes[Math.floor(Math.random() * 4)], 'paint':0};
    plane.material.color.set( yellow2blue(plane.userData.density).hex() );

    // add the building as a child of the pixel
    var geometry = new THREE.BoxGeometry(60, 60 ,4)
    geometry.translate(0, 0, .5)

    var matWhite = new THREE.MeshStandardMaterial( {color: 0xffffff, roughness: 1, metalness: .5, side: 0} );
    matWhite.transparent = true;
    matWhite.opacity = 1;

    var box = new THREE.Mesh( geometry, matWhite )
    box.name = 'building' + i + j
    box.castShadow = true;
    box.receiveShadow = true;
    box.scale.set(1, 1, plane.userData.density)
    if (plane.userData.use == 'park') {
      box.visible = false;
    }

    plane.add(box);

    group.add( plane );
  }
}

scene.add( group );
console.log(group)

var segments = 64;
var material = new THREE.LineBasicMaterial( { color: 0x007bff } );
var geometry = new THREE.CircleGeometry( 1, segments );

// Remove center vertex
geometry.vertices.shift();

brush = new THREE.LineLoop( geometry, material )
brush.rotation.x = - Math.PI / 2;
brush.scale.set(brushSize, brushSize, 1);

scene.add( brush );

function chooseUse(element) {
  selectedUse = element.innerHTML
  $('#useDropdown').text(element.innerHTML)
}

function paintDensity () {

  var intersectsPlane = raycaster.intersectObjects( [scene.getObjectByName('basePlane')] );

  group.traverse( function ( child ) {
    var distance = intersectsPlane[0].point.distanceTo( child.position );
    if (distance <= brushSize && child.name.includes('pixel')) {

      var brushAdd = brushIntensity * ((brushSize - distance) / brushSize) / brushFeathering
      if (brushAdd >= brushIntensity) {
        brushAdd = brushIntensity
      }

      if (!child.userData.starting) {
        child.userData.starting = child.userData.density
      }
      if (!child.userData.add) {
        child.userData.add = brushAdd;
      }
      if (child.userData.add < brushAdd) {
        child.userData.add = brushAdd;
      }
      child.userData.density = child.userData.starting + child.userData.add
      child.children[0].scale.set(1, 1, child.userData.density)
      child.material.color.set(yellow2blue(child.userData.density).hex() );
    }
  });
}

function paintUse () {

  var intersectsPlane = raycaster.intersectObjects( [scene.getObjectByName('basePlane')] );

  group.traverse( function ( child ) {
    var distance = intersectsPlane[0].point.distanceTo( child.position );
    if (distance <= brushSize && child.name.includes('pixel')) {
      child.userData.use = selectedUse
      child.material.color.set(useColors[child.userData.use]);
      if (selectedUse == 'park') {
        child.children[0].visible = false;
      } else {
        child.children[0].visible = true;
      }
    }
  });

}

function onMouseDown (event) {

  mouseDown = true;

  if (mode == 'density') {
    paintDensity()
  } else {
    paintUse()
  }
}

function onMouseUp (event) {
  mouseDown = false;

  group.traverse( function ( child ) {
    if (child instanceof THREE.Mesh) {
      child.userData.starting = child.userData.density;
      child.userData.add = 0;
    }
  })

}

function onMouseMove( event ) {

	// calculate mouse position in normalized device coordinates
	// (-1 to +1) for both components
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

  // update the picking ray with the camera and mouse position
  raycaster.setFromCamera( mouse, camera );

  var intersectsPlane = raycaster.intersectObjects( [scene.getObjectByName('basePlane')] );

  brush.position.set( intersectsPlane[0].point.x, 0, intersectsPlane[0].point.z );
  if (mouseDown == true) {
    onMouseDown()
  }
}

var geometry = new THREE.PlaneGeometry( 10000, 10000 );

var material = new THREE.MeshBasicMaterial( {color: 0x00ff00, side: THREE.SingleSide} );
material.wireframe = false;
material.transparent = true;
material.opacity = 0;

var plane = new THREE.Mesh( geometry, material );
plane.name = "basePlane"
plane.rotation.x = - Math.PI / 2;
scene.add(plane)

document.addEventListener('keydown', (event) => {
  const keyName = event.key;

  if (keyName === '[') {
    brush.scale.set( brush.scale.x - 5, brush.scale.y - 5, brush.scale.z - 5)
    brushSize -= 10
    brushSizeSlider.data("ionRangeSlider").update({
      from: brushSize,
    });
  }

  if (keyName === ']') {
    brush.scale.set( brush.scale.x + 5, brush.scale.y + 5, brush.scale.z + 5)
    brushSize += 10
    brushSizeSlider.data("ionRangeSlider").update({
      from: brushSize,
    });
  }
}, false);

function densityMode () {
  mode = 'density'
  $('#densityButton').addClass('active')
  $('#useButton').removeClass('active')
  group.traverse( function ( child ) {
    if (child instanceof THREE.Mesh) {
      child.material.color.set(yellow2blue(child.userData.density).hex() );
    }
  });
};

function useMode() {
  mode = 'use'
  $('#useButton').addClass('active')
  $('#densityButton').removeClass('active')
  group.traverse( function ( child ) {
    if (child instanceof THREE.Mesh) {
      child.material.color.set(useColors[child.userData.use]);
    };
  });
};

window.addEventListener( 'mousemove', onMouseMove, false );
window.addEventListener( 'mousedown', onMouseDown, false );
window.addEventListener( 'mouseup', onMouseUp, false );

function render() {

  // this is important for autoRotate and Dampening to work
  controls.update();

	renderer.render( scene, camera );

}

window.requestAnimationFrame(render);

brushSizeSlider = $("#brushSize")
brushSizeSlider.ionRangeSlider({
  min: 5,
  max: 1000,
  from: 500,
  hide_min_max: true,
  onChange: function (data) {
    brush.scale.set( data.from, data.from, data.from)
    brushSize = data.from
  },
});

brushIntensitySlider = $("#brushIntensity")
brushIntensitySlider.ionRangeSlider({
  min: 1,
  max: 20,
  from: brushIntensity,
  step: 1,
  hide_min_max: true,
  onChange: function (data) {
    brushIntensity = data.from
  }
});

brushFeatherSlider = $("#brushFeathering")
brushFeatherSlider.ionRangeSlider({
  min: 0.0,
  max: 1.0,
  from: brushFeathering,
  step: .1,
  hide_min_max: true,
  onChange: function (data) {
    brushFeathering = data.from
  }
});

brushPercCoverageSlider = $("#brushPercCoverage")
brushPercCoverageSlider.ionRangeSlider({
  min: 1,
  max: 100,
  from: brushPercCoverage,
  step: 1,
  hide_min_max: true,
  onChange: function (data) {
    brushPercCoverage = data.from
  }
});

// add the data.gui so we can make manual adjustments to the scene
function addGui () {

  var gui = new dat.GUI({ autoplace: false });

  // place the gui in a more useful location
  gui.domElement.id = 'my-gui-container';

  var params = {
    backgroundColor: '#' + scene.background.getHexString(),
    colorAmbLight: '#' + scene.getObjectByName( 'ambientLight' ).color.getHexString(),
    colorDirLight1: '#' + scene.getObjectByName( 'directionalLight1' ).color.getHexString(),
    colorDirLight2: '#' + scene.getObjectByName( 'directionalLight2' ).color.getHexString(),
    colorFog: '#' + scene.fog.color.getHexString(),
  };

  var lghtng = gui.addFolder('Lighting');
  lghtng.addColor( params, 'colorAmbLight' )
    .onChange( function() { scene.getObjectByName( 'ambientLight' ).color.set( params.colorAmbLight ); } );
  lghtng.add( scene.getObjectByName( 'ambientLight' ), 'intensity', 0, 3);
  lghtng.addColor( params, 'colorDirLight1' )
    .onChange( function() { scene.getObjectByName( 'directionalLight1' ).color.set( params.colorDirLight1 ); } );
  lghtng.add( scene.getObjectByName( 'directionalLight1' ), 'intensity', 0, 3);
  lghtng.add( scene.getObjectByName( 'directionalLight1' ).position, 'x', -2000, 2000);
  lghtng.add( scene.getObjectByName( 'directionalLight1' ).position, 'y', 0, 2000);
  lghtng.add( scene.getObjectByName( 'directionalLight1' ).position, 'z', -2000, 2000);
  lghtng.add( scene.getObjectByName( 'directionalLight1Helper' ), 'visible');
  lghtng.addColor( params, 'colorDirLight2' )
    .onChange( function() { scene.getObjectByName( 'directionalLight2' ).color.set( params.colorDirLight2 ); } );
  lghtng.add( scene.getObjectByName( 'directionalLight2' ), 'intensity', 0, 3);
  lghtng.addColor( params, 'colorFog' )
    .onChange( function() { scene.fog.color.set( params.colorFog ); } );
  lghtng.add( scene.fog, 'near', -10000, 10000);
  lghtng.add( scene.fog, 'far', -10000, 10000);
  lghtng.open();

  var scn = gui.addFolder('Scene');
  scn.addColor( params, 'backgroundColor' )
    .onChange( function() { scene.background.set( params.backgroundColor ); } );

  scn.open();

  var cntrls = gui.addFolder('Controls');
  cntrls.add(controls, 'enableDamping');
  cntrls.add(controls, 'dampingFactor', 0, 1);
  cntrls.open();

  gui.add(options, 'stop');
  gui.add(options, 'reset');

};

document.addEventListener('keyup', function (event) {
  if (event.defaultPrevented) {
      return;
  }

  var key = event.key || event.keyCode;

  if (key === 'Escape' || key === 'Esc' || key === 27) {
      addGui();
  }
});
