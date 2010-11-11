Thingiview = function(containerId) {
  scope = this;
  
  this.containerId  = containerId;
  var container     = document.getElementById(containerId);
  
  var stats    = null;
  var camera   = null;
  var scene    = null;
  var renderer = null;
  var object   = null;
  var plane    = null;
  
  var ambientLight     = null;
  var directionalLight = null;
  var pointLight       = null;
  
  var targetRotation             = 0;
  var targetRotationOnMouseDown  = 0;
  var mouseX                     = 0;
  var mouseXOnMouseDown          = 0;
  var mouseDown                  = false;
  
  var windowHalfX = window.innerWidth / 2;
  var windowHalfY = window.innerHeight / 2

  var view         = null;
  var infoMessage  = null;
  
  var timer        = null;
  var rotateTimer  = null;

  var cameraView = 'diagonal';
  var cameraZoom = 0;
  var rotate = false;
  var backgroundColor = '#606060';
  var objectMaterial = 'solid';
  var objectColor = 0xffffff;
  var showPlane = true;
  var isWebGl = false;

  var width  = parseFloat(document.defaultView.getComputedStyle(container,null).getPropertyValue('width'));
  var height = parseFloat(document.defaultView.getComputedStyle(container,null).getPropertyValue('height'));  

  var geometry;
  var urlbase = "";

  this.initScene = function() {
    container.style.position = 'relative';
    container.innerHTML      = '';

    // infoMessage                  = document.createElement('div');
    // infoMessage.style.position   = 'absolute';
    // infoMessage.style.top        = '10px';
    // infoMessage.style.width      = '100%';
    // infoMessage.style.textAlign  = 'center';
    // infoMessage.innerHTML        = 'Loading STL...';
    // container.appendChild(infoMessage);

  	camera = new THREE.Camera(65, width/ height, 1, 1000);
  	scene  = new THREE.Scene();

    // ambientLight = new THREE.AmbientLight(0x80ffff);
    // scene.addLight(ambientLight);
    // 
    // directionalLight = new THREE.DirectionalLight(0xffff00);
    // scene.addLight(directionalLight);

    // ambientLight = new THREE.AmbientLight(Math.random() * 0x202020);
    ambientLight = new THREE.AmbientLight(0x202020);
    scene.addLight(ambientLight);

    // directionalLight = new THREE.DirectionalLight( Math.random() * 0xffffff);
    // directionalLight.position.x = Math.random() - 0.5;
    // directionalLight.position.y = Math.random() - 0.5;
    // directionalLight.position.z = Math.random() - 0.5;
    directionalLight = new THREE.DirectionalLight(0xffffff);
    // directionalLight = new THREE.DirectionalLight(0x0000ff);
		directionalLight.position.x = 1;
		directionalLight.position.y = 1;
		directionalLight.position.z = 1;
    directionalLight.position.normalize();
		scene.addLight(directionalLight);

    // pointLight = new THREE.PointLight(0xff0000, 1);
    // scene.addLight(pointLight);

    testCanvas = document.createElement('canvas');
    try {
      if (testCanvas.getContext('experimental-webgl')) {
        showPlane = false;
        isWebGl = true;
        renderer = new THREE.WebGLRenderer();
      } else {
        renderer = new THREE.CanvasRenderer();
      }
    } catch(e) {
      renderer = new THREE.CanvasRenderer();
    }
    
    // load a blank object
    // this.loadSTLString('');

    if (showPlane) {
      loadPlaneGeometry();
    }
    
  	renderer.setSize(width, height);
    renderer.domElement.style.backgroundColor = backgroundColor;
  	container.appendChild(renderer.domElement);

    this.setCameraView(cameraView);
    this.setObjectMaterial(objectMaterial);

  	stats = new Stats();
  	stats.domElement.style.position  = 'absolute';
  	stats.domElement.style.top       = '0px';
  	container.appendChild(stats.domElement);

    // TODO: figure out how to get the render window to resize when window resizes
    // window.addEventListener('resize', onContainerResize(), false);
    // container.addEventListener('resize', onContainerResize(), false);

  	renderer.domElement.addEventListener('mousemove',      onRendererMouseMove,     false);    
    renderer.domElement.addEventListener('mouseover',      onRendererMouseOver,     false);
    renderer.domElement.addEventListener('mouseout',       onRendererMouseOut,      false);
  	renderer.domElement.addEventListener('mousedown',      onRendererMouseDown,     false);
    renderer.domElement.addEventListener('mouseup',        onRendererMouseUp,       false);

  	renderer.domElement.addEventListener('touchstart',     onRendererTouchStart,    false);
  	renderer.domElement.addEventListener('touchend',       onRendererTouchEnd,      false);
  	renderer.domElement.addEventListener('touchmove',      onRendererTouchMove,     false);

    renderer.domElement.addEventListener('DOMMouseScroll', onRendererScroll,        false);
  	renderer.domElement.addEventListener('mousewheel',     onRendererScroll,        false);
  	renderer.domElement.addEventListener('gesturechange',  onRendererGestureChange, false);
  }

  onContainerResize = function(event) {
    width  = parseFloat(document.defaultView.getComputedStyle(container,null).getPropertyValue('width'));
    height = parseFloat(document.defaultView.getComputedStyle(container,null).getPropertyValue('height'));

    // console.log("resized width: " + width + ", height: " + height);
  
    if (renderer) {
      renderer.setSize(width, height);
      camera.projectionMatrix = THREE.Matrix4.makePerspective(70, width / height, 1, 10000);
      sceneLoop();
    }    
  };
  
  onRendererScroll = function(event) {
    event.preventDefault();

    var rolled = 0;

    if (event.wheelDelta === undefined) {
      // Firefox
      // The measurement units of the detail and wheelDelta properties are different.
      rolled = -40 * event.detail;
    } else {
      rolled = event.wheelDelta;
    }

    if (rolled > 0) {
      // up
      scope.setCameraZoom(+5);
    } else {
      // down
      scope.setCameraZoom(-5);
    }
  }

  onRendererGestureChange = function(event) {
    event.preventDefault();

    if (event.scale > 1) {
      scope.setCameraZoom(+5);
    } else {
      scope.setCameraZoom(-5);
    }
  }

  onRendererMouseOver = function(event) {
    // console.log("over");
    targetRotation = object.rotation.z;
    timer = setInterval(sceneLoop, 1000/60);
  }

  onRendererMouseDown = function(event) {
    // console.log("down");
  	mouseDown = true;
  	event.preventDefault();
  	
  	clearInterval(rotateTimer);
    rotateTimer = null;
    
  	mouseXOnMouseDown = event.clientX - windowHalfX;
  	targetRotationOnMouseDown = targetRotation;
  }

  onRendererMouseMove = function(event) {
    // console.log("move");
    if (mouseDown) {
  	  mouseX = event.clientX - windowHalfX;
  	  targetRotation = targetRotationOnMouseDown + (mouseX - mouseXOnMouseDown) * 0.02;
	  }
  }

  onRendererMouseUp = function(event) {
    // console.log("up");
    mouseDown = false;
  }

  onRendererMouseOut = function(event) {
    // console.log("out");
    clearInterval(timer);
    timer = null;
    targetRotation = object.rotation.z;
  }

  onRendererTouchStart = function(event) {
    targetRotation = object.rotation.z;
    timer = setInterval(sceneLoop, 1000/60);

  	if (event.touches.length == 1) {
  		event.preventDefault();

  		mouseXOnMouseDown = event.touches[0].pageX - windowHalfX;
  		targetRotationOnMouseDown = targetRotation;
  	}
  }

  onRendererTouchEnd = function(event) {
    clearInterval(timer);
    timer = null;
    targetRotation = object.rotation.z;
  }

  onRendererTouchMove = function(event) {
  	if (event.touches.length == 1) {
  		event.preventDefault();

  		mouseX = event.touches[0].pageX - windowHalfX;
  		targetRotation = targetRotationOnMouseDown + (mouseX - mouseXOnMouseDown) * 0.05;
  	}
  }

  sceneLoop = function() {
    if (stats && object) {
      // if (view == 'bottom') {
      //   if (showPlane) {
      //     plane.rotation.z = object.rotation.z -= (targetRotation + object.rotation.z) * 0.05;
      //   } else {
      //     object.rotation.z -= (targetRotation + object.rotation.z) * 0.05;
      //   }
      // } else {
      //   if (showPlane) {
      //     plane.rotation.z = object.rotation.z += (targetRotation - object.rotation.z) * 0.05;
      //   } else {
      //     object.rotation.z += (targetRotation - object.rotation.z) * 0.05;
      //   }
      // }

      if (view == 'bottom') {
        if (showPlane) {
          plane.rotation.z = object.rotation.z -= (targetRotation + object.rotation.z) * 0.05;
        } else {
          object.rotation.z -= (targetRotation + object.rotation.z) * 0.05;
        }
      } else {
        if (showPlane) {
          plane.rotation.z = object.rotation.z += (targetRotation - object.rotation.z) * 0.05;
        } else {
          object.rotation.z += (targetRotation - object.rotation.z) * 0.05;
        }
      }

      // camera.updateMatrix();
      // object.updateMatrix();
      
      if (showPlane) {
        // plane.updateMatrix();
      }

    	renderer.render(scene, camera);
    	stats.update();
    }
  }

  rotateLoop = function() {
    targetRotation += 0.01;
    sceneLoop();
  }

  this.setShowPlane = function(show) {
    showPlane = show;

    if (show) {
      if (scene && !plane) {
        loadPlaneGeometry();
      }
    } else {
      if (scene && plane) {
        scene.removeObject(plane);
        plane = null;
      }
    }
  }

  this.setRotation = function(rotate) {
    rotation = rotate;
    
    if (rotate) {
      rotateTimer = setInterval(rotateLoop, 1000/60);
    } else {
      clearInterval(rotateTimer);
      rotateTimer = null;
    }
  }

  this.setCameraView = function(dir) {
    cameraView = dir;
    
    if (dir == 'top') {
      camera.position.y = 0;
      camera.position.z = 100;

      camera.target.position.z = 0;
      if (showPlane) {
        plane.flipSided = false;
      }
    } else if (dir == 'side') {
      camera.position.y = 100;
      camera.position.z = -0.1;

      // camera.position.z = -100;
      // camera.position.y = 100;
      // camera.position.y = 100;
      camera.position.z = 10;
      camera.target.position.z = 50;
      if (showPlane) {
        plane.flipSided = false;
      }
    } else if (dir == 'bottom') {
      camera.position.y = 0;
      camera.position.z = -100;

      camera.target.position.z = 0;
      if (showPlane) {
        plane.flipSided = true;
      }
    } else {
      camera.position.y = -70;
      camera.position.z = 70;

      camera.target.position.z = 0;
      if (showPlane) {
        plane.flipSided = false;
      }
    }

    targetRotation     = 0;
    
    if (object) {
      object.rotation.z  = 0;
    }
    
    if (showPlane && object) {
      plane.rotation.z = object.rotation.z;
    }

    sceneLoop();
  }

  this.setCameraZoom = function(factor) {
    cameraZoom = factor;
    
    if (cameraView == 'top') {
      camera.position.z -= factor;
    } else if (cameraView == 'bottom') {
      camera.position.z += factor;
    } else if (cameraView == 'side') {
      camera.position.y -= factor;
    } else {
      camera.position.y += factor;
      camera.position.z -= factor;
    }

    sceneLoop();
  }

  this.setObjectMaterial = function(type) {
    objectMaterial = type;

    loadObjectGeometry();
  }

  this.setBackgroundColor = function(color) {
    backgroundColor = color
    
    if (renderer) {
      renderer.domElement.style.backgroundColor = color;
    }
  }

  this.setObjectColor = function(color) {
    objectColor = color;
    
    loadObjectGeometry();
  }

  this.loadSTL = function(url) {
    scope.newWorker('loadSTL', url);
  }

  this.loadOBJ = function(url) {
    scope.newWorker('loadOBJ', url);
  }
  
  this.loadSTLString = function(STLString) {
    scope.newWorker('loadSTLString', STLString);
  }
  
  this.loadSTLBinary = function(STLBinary) {
    scope.newWorker('loadSTLBinary', STLBinary);
  }
  
  this.loadOBJString = function(OBJString) {
    scope.newWorker('loadOBJString', OBJString);
  }

  this.newWorker = function(cmd, param) {
    var worker = new Worker(scope.urlbase + '/thingiloader.js');
    
    worker.onmessage = function(event) {
      if (event.data.status == "complete") {
        scene.removeObject(object);
        geometry = new STLGeometry(event.data.content);
        loadObjectGeometry();
      } else if (event.data.status == "progress") {
        console.log(event.data.content);
      } else {
        console.log('Unknown Worker Message: ' + event.data);
      }
    }

    worker.onerror = function(error) {
      console.log(error);
      error.preventDefault();
    }

    worker.postMessage({'cmd':cmd, 'param':param});
  }

  function loadPlaneGeometry() {
    // plane = new THREE.Mesh(new Plane(100, 100, 10, 10), new THREE.MeshColorStrokeMaterial(0xafafaf, 0.5, 1));
    plane = new THREE.Mesh(new Plane(100, 100, 10, 10), new THREE.MeshColorStrokeMaterial(0xafafaf, 0.5, 0.5));
    // plane = new THREE.Mesh(new Plane(100, 100, 10, 10), new THREE.MeshColorFillMaterial(0xffffff, 0.5));
    // plane.updateMatrix();
    // plane.doubleSided = true;
    // plane.position.z = 1;
    scene.addObject(plane);    
  }

  function loadObjectGeometry() {
    if (scene && geometry) {
      scene.removeObject(object);
    
      if (objectMaterial == 'wireframe') {
        object = new THREE.Mesh(geometry, new THREE.MeshColorStrokeMaterial(objectColor, 1, 1));
      } else {
        object = new THREE.Mesh(geometry, new THREE.MeshColorFillMaterial(objectColor));
      }

      object.overdraw = true;
      object.updateMatrix();
  		scene.addObject(object);
    
      targetRotation = 0;
    
      sceneLoop();
    }
  }

};

var STLGeometry = function(STLArray) {
	THREE.Geometry.call(this);

	var scope = this;

  var vertexes = STLArray[0];
  var normals  = STLArray[1];
  var faces    = STLArray[2];

  for (var i=0; i<vertexes.length; i++) {    
    v(vertexes[i][0], vertexes[i][1], vertexes[i][2]);
  }

  for (var i=0; i<faces.length; i++) {
    f3(faces[i][0], faces[i][1], faces[i][2]);
  }

  function v(x, y, z) {
    scope.vertices.push( new THREE.Vertex( new THREE.Vector3( x, y, z ) ) );
  }

  function f3(a, b, c) {
    scope.faces.push( new THREE.Face3( a, b, c ) );
  }

  this.computeCentroids();
  this.computeNormals();
}

STLGeometry.prototype = new THREE.Geometry();
STLGeometry.prototype.constructor = STLGeometry;
