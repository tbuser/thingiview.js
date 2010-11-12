Thingiview = function(containerId) {
  scope = this;
  
  this.containerId  = containerId;
  var container     = document.getElementById(containerId);
  
  // var stats    = null;
  var camera   = null;
  var scene    = null;
  var renderer = null;
  var object   = null;
  var plane    = null;
  
  var ambientLight     = null;
  var directionalLight = null;
  var pointLight       = null;
  
  var targetXRotation             = 0;
  var targetXRotationOnMouseDown  = 0;
  var mouseX                      = 0;
  var mouseXOnMouseDown           = 0;

  var targetYRotation             = 0;
  var targetYRotationOnMouseDown  = 0;
  var mouseY                      = 0;
  var mouseYOnMouseDown           = 0;

  var mouseDown                  = false;
  
  var windowHalfX = window.innerWidth / 2;
  var windowHalfY = window.innerHeight / 2

  var view         = null;
  var infoMessage  = null;
  var progressBar  = null;
  
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

    testCanvas = document.createElement('canvas');
    try {
      if (testCanvas.getContext('experimental-webgl')) {
        // showPlane = false;
        isWebGl = true;
        renderer = new THREE.WebGLRenderer();
      } else {
        renderer = new THREE.CanvasRenderer();
      }
    } catch(e) {
      renderer = new THREE.CanvasRenderer();
    }

    // ambientLight = new THREE.AmbientLight(0x80ffff);
    // scene.addLight(ambientLight);
    // 
    // directionalLight = new THREE.DirectionalLight(0xffff00);
    // scene.addLight(directionalLight);

    // ambientLight = new THREE.AmbientLight(Math.random() * 0x202020);
    if (!isWebGl) {
      ambientLight = new THREE.AmbientLight(0x202020);
      scene.addLight(ambientLight);
    }
    
    // directionalLight = new THREE.DirectionalLight( Math.random() * 0xffffff);
    // directionalLight.position.x = Math.random() - 0.5;
    // directionalLight.position.y = Math.random() - 0.5;
    // directionalLight.position.z = Math.random() - 0.5;
    if (isWebGl) {
      directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    } else {
      directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    }
    // directionalLight = new THREE.DirectionalLight(0x0000ff);
		directionalLight.position.x = 1;
		directionalLight.position.y = 1;
		directionalLight.position.z = 2;
    directionalLight.position.normalize();
    scene.addLight(directionalLight);

    pointLight1 = new THREE.PointLight(0xffffff, 0.2);
    pointLight1.position.x = 0;
    pointLight1.position.y = 50;
    pointLight1.position.z = -10;
    scene.addLight(pointLight1);

    pointLight2 = new THREE.PointLight(0xffffff, 0.2);
    pointLight2.position.x = 0;
    pointLight2.position.y = -50;
    pointLight2.position.z = 10;
    scene.addLight(pointLight2);

    // pointLight3 = new THREE.PointLight(0xffffff, 1);
    // pointLight3.position.x = -50;
    // pointLight3.position.y = 50;
    // pointLight3.position.z = 0;
    // scene.addLight(pointLight3);
    // 
    // pointLight4 = new THREE.PointLight(0xffffff, 1);
    // pointLight4.position.x = -50;
    // pointLight4.position.y = -50;
    // pointLight4.position.z = 0;
    // scene.addLight(pointLight4);

    renderer.setSize(container.innerWidth, container.innerHeight);

    progressBar = document.createElement('div');
    progressBar.style.position = 'absolute';
    progressBar.style.top = '0px';
    progressBar.style.left = '0px';
    // progressBar.style.width = '5%';
    // progressBar.style.height = '10%';
    progressBar.style.backgroundColor = 'red';
    // progressBar.innerHTML = 'Testing................';
    progressBar.style.padding = '5px';
    // progressBar.style.fontSize = '20pt';
    progressBar.style.display = 'none';
    progressBar.style.overflow = 'visible';
    progressBar.style.whiteSpace = 'nowrap';
    progressBar.style.zIndex = 100;
    container.appendChild(progressBar);
    
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

    // stats = new Stats();
    // stats.domElement.style.position  = 'absolute';
    // stats.domElement.style.top       = '0px';
    // container.appendChild(stats.domElement);

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

  // FIXME
  onContainerResize = function(event) {
    width  = parseFloat(document.defaultView.getComputedStyle(container,null).getPropertyValue('width'));
    height = parseFloat(document.defaultView.getComputedStyle(container,null).getPropertyValue('height'));

    // log("resized width: " + width + ", height: " + height);
  
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
      scope.setCameraZoom(+10);
    } else {
      // down
      scope.setCameraZoom(-10);
    }
  }

  onRendererGestureChange = function(event) {
    event.preventDefault();

    if (event.scale > 1) {
      scope.setCameraZoom(+10);
    } else {
      scope.setCameraZoom(-10);
    }
  }

  onRendererMouseOver = function(event) {
    // targetRotation = object.rotation.z;
    if (timer == null) {
      timer = setInterval(sceneLoop, 1000/60);
    }
  }

  onRendererMouseDown = function(event) {
    // log("down");

    event.preventDefault();

  	mouseDown = true;
  	event.preventDefault();
  	
  	clearInterval(rotateTimer);
    rotateTimer = null;
    
  	mouseXOnMouseDown = event.clientX - windowHalfX;
  	mouseYOnMouseDown = event.clientY - windowHalfY;
  	targetXRotationOnMouseDown = targetXRotation;
  	targetYRotationOnMouseDown = targetYRotation;
  }

  onRendererMouseMove = function(event) {
    // log("move");
    if (mouseDown) {
  	  mouseX = event.clientX - windowHalfX;
  	  targetXRotation = targetXRotationOnMouseDown + (mouseX - mouseXOnMouseDown) * 0.02;

  	  mouseY = event.clientY - windowHalfY;
  	  targetYRotation = targetYRotationOnMouseDown + (mouseY - mouseYOnMouseDown) * 0.02;
	  }
  }

  onRendererMouseUp = function(event) {
    // log("up");
    mouseDown = false;
  }

  onRendererMouseOut = function(event) {
    // log("out");
    clearInterval(timer);
    timer = null;
    // targetRotation = object.rotation.z;
  }

  onRendererTouchStart = function(event) {
    targetXRotation = object.rotation.z;
    targetYRotation = object.rotation.x;

    timer = setInterval(sceneLoop, 1000/60);

  	if (event.touches.length == 1) {
  		event.preventDefault();

  		mouseXOnMouseDown = event.touches[0].pageX - windowHalfX;
  		targetXRotationOnMouseDown = targetXRotation;

  		mouseYOnMouseDown = event.touches[0].pageY - windowHalfY;
  		targetYRotationOnMouseDown = targetYRotation;
  	}
  }

  onRendererTouchEnd = function(event) {
    clearInterval(timer);
    timer = null;
    targetXRotation = object.rotation.z;
    targetYRotation = object.rotation.x;
  }

  onRendererTouchMove = function(event) {
  	if (event.touches.length == 1) {
  		event.preventDefault();

  		mouseX = event.touches[0].pageX - windowHalfX;
  		targetXRotation = targetXRotationOnMouseDown + (mouseX - mouseXOnMouseDown) * 0.05;

  		mouseY = event.touches[0].pageY - windowHalfY;
  		targetYRotation = targetYRotationOnMouseDown + (mouseY - mouseYOnMouseDown) * 0.05;
  	}
  }

  sceneLoop = function() {
    if (object) {
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

      if (showPlane) {
        plane.rotation.z = object.rotation.z = (targetXRotation - object.rotation.z) * 0.2;
        plane.rotation.x = object.rotation.x = (targetYRotation - object.rotation.x) * 0.2;
      } else {
        object.rotation.z = (targetXRotation - object.rotation.z) * 0.2;
        object.rotation.x = (targetYRotation - object.rotation.x) * 0.2;
      }

      // log(object.rotation.x);

      // camera.updateMatrix();
      // object.updateMatrix();
      
      // if (showPlane) {
        // plane.updateMatrix();
      // }

    	renderer.render(scene, camera);
      // stats.update();
    }
  }

  rotateLoop = function() {
    // targetRotation += 0.01;
    targetXRotation += 0.1;
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

    targetXRotation       = 0;
    targetYRotation       = 0;

    if (object) {
      object.rotation.x = 0;
      object.rotation.y = 0;
      object.rotation.z = 0;
    }

    if (showPlane && object) {
      plane.rotation.x = object.rotation.x;
      plane.rotation.y = object.rotation.y;
      plane.rotation.z = object.rotation.z;
    }
    
    if (dir == 'top') {
      camera.position.y = 0;
      camera.position.z = 100;

      camera.target.position.z = 0;
      if (showPlane) {
        plane.flipSided = false;
      }
    } else if (dir == 'side') {
      // camera.position.y = 100;
      // camera.position.z = -0.1;
      // camera.position.z = 10;
      // camera.target.position.z = 50;

      // if (object) {
      //   object.rotation.x = -0.75;
      // }
      // 
      // if (showPlane) {
      //   plane.rotation.x = -0.75;
      // }

      camera.position.y = -70;
      camera.position.z = 70;
      targetYRotation = -4.5;

      camera.target.position.z = 0;
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

    mouseX            = targetXRotation;
    mouseXOnMouseDown = targetXRotation;
    
    mouseY            = targetYRotation;
    mouseYOnMouseDown = targetYRotation;
    
    sceneLoop();
  }

  this.setCameraZoom = function(factor) {
    cameraZoom = factor;
    
    if (cameraView == 'top') {
      camera.position.z -= factor;
    } else if (cameraView == 'bottom') {
      camera.position.z += factor;
    } else if (cameraView == 'side') {
      camera.position.y += factor;
      camera.position.z -= factor;
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
    clearInterval(rotateTimer);
    rotateTimer = null;
  	
    var worker = new Worker(scope.urlbase + '/thingiloader.js');
    
    worker.onmessage = function(event) {
      if (event.data.status == "complete") {
        progressBar.innerHTML = 'Initializing geometry...';
        scene.removeObject(object);
        geometry = new STLGeometry(event.data.content);
        loadObjectGeometry();
        progressBar.innerHTML = '';
        progressBar.style.display = 'none';

        clearInterval(rotateTimer);
        rotateTimer = null;
        rotateTimer = setInterval(rotateLoop, 1000/60);
      } else if (event.data.status == "progress") {
        progressBar.style.display = 'block';
        progressBar.style.width = event.data.content;
        log(event.data.content);
      } else if (event.data.status == "message") {
        progressBar.style.display = 'block';
        progressBar.innerHTML = event.data.content;
        log(event.data.content);
      } else {
        alert('Error: ' + event.data);
        log('Unknown Worker Message: ' + event.data);
      }
    }

    worker.onerror = function(error) {
      log(error);
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
        material = new THREE.MeshColorStrokeMaterial(objectColor, 1, 1);
      } else {
        if (isWebGl) {
          material = new THREE.MeshPhongMaterial(objectColor, objectColor, 0xffffff, 50, 1.0);
        } else {
          material = new THREE.MeshColorFillMaterial(objectColor);
        }
      }

      object = new THREE.Mesh(geometry, material);

      object.overdraw = true;
      // object.updateMatrix();
  		scene.addObject(object);
    
      targetXRotation = 0;
      targetYRotation = 0;
    
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

function log(msg) {
  if (this.console) {
    console.log(msg);
  }
}