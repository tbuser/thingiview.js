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

  var width  = parseFloat(document.defaultView.getComputedStyle(container,null).getPropertyValue('width'));
  var height = parseFloat(document.defaultView.getComputedStyle(container,null).getPropertyValue('height'));  

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

  	camera = new THREE.Camera(70, width/ height, 1, 10000);
  	scene  = new THREE.Scene();

    // load a blank object
    this.loadSTLString('');

    if (showPlane) {
      loadPlaneGeometry();
    }

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
        renderer = new THREE.WebGLRenderer();
      } else {
        renderer = new THREE.CanvasRenderer();
      }
    } catch(e) {
      renderer = new THREE.CanvasRenderer();
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
    if (stats) {
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

      camera.updateMatrix();
      object.updateMatrix();
      
      if (showPlane) {
        plane.updateMatrix();
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

  function loadPlaneGeometry() {
    // plane = new THREE.Mesh(new Plane(100, 100, 10, 10), new THREE.MeshColorStrokeMaterial(0xafafaf, 0.5, 1));
    plane = new THREE.Mesh(new Plane(100, 100, 2, 2), new THREE.MeshColorStrokeMaterial(0xafafaf, 0.5, 0.5));
    // plane = new THREE.Mesh(new Plane(100, 100, 10, 10), new THREE.MeshColorFillMaterial(0xffffff, 0.5));
    plane.updateMatrix();
    // plane.doubleSided = true;
    // plane.position.z = 1;
    scene.addObject(plane);    
  }

  function loadObjectGeometry() {
    if (scene) {
      scene.removeObject(object);
    
      if (objectMaterial == 'wireframe') {
        object = new THREE.Mesh(geometry, new THREE.MeshColorStrokeMaterial(objectColor, 1, 1));
      } else {
        object = new THREE.Mesh(geometry, new THREE.MeshColorFillMaterial(objectColor));
      }

      object.overDraw = true;
      object.updateMatrix();
  		scene.addObject(object);
    
      targetRotation = 0;
    
      sceneLoop();
    }
  }

  // Code from https://developer.mozilla.org/En/Using_XMLHttpRequest#Receiving_binary_data
  function load_binary_resource(url) {
  	var req = new XMLHttpRequest();
  	req.open('GET', url, false);
  	// The following line says we want to receive data as Binary and not as Unicode
  	req.overrideMimeType('text/plain; charset=x-user-defined');
  	req.send(null);
  	if (req.status != 200) return '';
  	return req.responseText;
  }

  this.loadSTL = function(url) {
    var file = load_binary_resource(url);
    var reader = new BinaryReader(file);
    if (reader.readString(5) == "solid") {
      scope.loadSTLString(file);
    } else {
      scope.loadSTLBinary(reader);
    }

    // BinaryAjax(
    //   url,
    //   function(http) {
    //     var mime = http.getResponseHeader("Content-Type");
    //     // console.log('mime type: ' + mime);
    //     var res = http.binaryResponse;
    // 
    //     // console.log(typeof res.getRawData());
    // 
    //     rawdata = res.getRawData();
    //     
    //     if (rawdata.indexOf('solid') == 0) {
    //       // console.log("ascii");
    //       scope.loadSTLString(rawdata);
    //     } else {
    //       // console.log("binary");
    //       scope.loadSTLBinary(res);
    //     }
    //   },
    //   null,
    //   null      
    // )
  }

  this.loadOBJ = function(url) {
    BinaryAjax(
      url,
      function(http) {
        var mime = http.getResponseHeader("Content-Type");
        // console.log('mime type: ' + mime);
        var res = http.binaryResponse;

        // console.log(typeof res.getRawData());

        rawdata = res.getRawData();
        
        scope.loadOBJString(rawdata);
      },
      null,
      null      
    )
  }

  this.loadSTLString = function(STLString) {
    scene.removeObject(object);

    var STLArray = ParseSTLString(STLString);

    geometry = new STLGeometry(STLArray);

    loadObjectGeometry();
  }

  this.loadSTLBinary = function(STLBinary) {
    scene.removeObject(object);

    var STLArray = ParseSTLBinary(STLBinary);

    geometry = new STLGeometry(STLArray);

    loadObjectGeometry();
  }
  
  this.loadOBJString = function(OBJString) {
    alert('not implemented')
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
    // console.log("vertex = " + vertexes[i][0] + ", " + vertexes[i][1] + ", " + vertexes[i][2]);
  }

  for (var i=0; i<faces.length; i++) {
    f3(faces[i][0], faces[i][1], faces[i][2]);
    // console.log("face = " + faces[i][0] + ", " + faces[i][1] + ", " + faces[i][2]);
  }

  function v(x, y, z) {
    scope.vertices.push( new THREE.Vertex( new THREE.Vector3( x, y, z ) ) );
  }

  function f3(a, b, c) {
    scope.faces.push( new THREE.Face3( a, b, c ) );
  }

  // console.log("Starting to compute normals")
  this.computeNormals();
  // console.log("Finished STLGeometry")
}

STLGeometry.prototype = new THREE.Geometry();
STLGeometry.prototype.constructor = STLGeometry;

// indexOf only finds strings? seriously Javascript, seriously?!
Array.prototype.myIndexOf = function(searchstring, indexstart) {
  if (indexstart == undefined) {
    indexstart = 0;
  }
  
	var result = -1;
	for (i=indexstart; i<this.length; i++) {
		if (this[i] == searchstring) {
			result = i;
			break;
		}
	}
	return result;
};

function ParseSTLBinary(STLBinary) {
  var vertexes  = [];
  var normals   = [];
  var faces     = [];
  
  var face_vertexes = [];

  // header = STLBinary.getStringAt(0, 80);
  STLBinary.seek(0);
  header = STLBinary.readString(80);
  console.log("header = '" + header + "'");
  
  // count = STLBinary.getShortAt(80);
  // STLBinary.seek(80);
  count = STLBinary.readUInt32();
  console.log("number of triangles = " + count);
  // count = 10000;

  for (var i = 0; i < count; i++) {
    var start = 81 + (i * 13);
    
    var normal = [];
    for (var x = 0; x < 3; x++) {
      // STLBinary.seek(start + x);
      normal.push(STLBinary.readFloat());
    }
    normals.push(normal);
    // console.log("normal = " + normal);
    
    for (var x = 0; x < 3; x++) {
      var vertex_start = (start + 3) + (x * 3)

      var vertex = [];
      for (var y = 0; y < 3; y++) {
        // STLBinary.seek(vertex_start + y);
        vertex.push(STLBinary.readFloat());
      }
      
      if (vertexes.myIndexOf(vertex) == -1) {
        vertexes.push(vertex);
        // console.log("vertex = " + vertex);
      }

      if (face_vertexes[i] == undefined) {
        face_vertexes[i] = [];
      }
      face_vertexes[i].push(vertex);
      
      // vertexes.push(vertex);
      // console.log("vertex = " + vertex);
    }
    
    // STLBinary.seek(start + 13);
    attribute = STLBinary.readUInt16();
    // console.log("attribute byte count = " + attribute);
  }

  console.log("size = " + STLBinary.getSize());
  console.log("position = " + STLBinary.getPosition());
  
  for (var i=0; i<face_vertexes.length; i++) {
    // console.log("face vertex " + i + " = " + face_vertexes[i]);
    
    if (faces[i] == undefined) {
      faces[i] = [];
    }
  
    for (var fvi=0; fvi<face_vertexes[i].length; fvi++) {
      // console.log(i + " looking for " + face_vertexes[i][fvi])
      faces[i].push(vertexes.myIndexOf(face_vertexes[i][fvi]))
      // console.log("found " + vertexes.indexOf(face_vertexes[i][fvi]))
    }
  
    // for material
    faces[i].push(0);
  }
  
  return [vertexes, normals, faces];
  // return[[],[],[]];
}

// build stl's vertex and face arrays
function ParseSTLString(STLString) {
  var vertexes  = [];
  var normals   = [];
  var faces     = [];
  
  var face_vertexes = [];

  // console.log(STLString);

  // strip out extraneous stuff
  STLString = STLString.replace(/\n/g, " ");
  STLString = STLString.replace(/solid\s(\w+)?/, "");
  STLString = STLString.replace(/facet normal /g,"");
  STLString = STLString.replace(/outer loop/g,"");  
  STLString = STLString.replace(/vertex /g,"");
  STLString = STLString.replace(/endloop/g,"");
  STLString = STLString.replace(/endfacet/g,"");
  STLString = STLString.replace(/endsolid\s(\w+)?/, "");
  STLString = STLString.replace(/\s+/g, " ");
  STLString = STLString.replace(/^\s+/, "");

  // console.log(STLString);

  var facet_count = 0;
  var block_start = 0;

  var points = STLString.split(" ");

  for (var i=0; i<points.length/12-1; i++) {
    normal = [parseFloat(points[block_start]), parseFloat(points[block_start+1]), parseFloat(points[block_start+2])]
    normals.push(normal)
    // console.log(normal)
    
    for (var x=0; x<3; x++) {
      vertex = [parseFloat(points[block_start+x*3+3]), parseFloat(points[block_start+x*3+4]), parseFloat(points[block_start+x*3+5])];

      if (vertexes.myIndexOf(vertex) == -1) {
        vertexes.push(vertex);
        // console.log(vertex);
      }

      if (face_vertexes[i] == undefined) {
        face_vertexes[i] = [];
      }
      face_vertexes[i].push(vertex);
    }
    
    block_start = block_start + 12;
  }

  // console.log("calculating faces")
  for (var i=0; i<face_vertexes.length; i++) {
    // console.log("face vertex " + i + " = " + face_vertexes[i]);
    
    if (faces[i] == undefined) {
      faces[i] = [];
    }
  
    for (var fvi=0; fvi<face_vertexes[i].length; fvi++) {
      // console.log(i + " looking for " + face_vertexes[i][fvi])
      faces[i].push(vertexes.myIndexOf(face_vertexes[i][fvi]))
      // console.log("found " + vertexes.indexOf(face_vertexes[i][fvi]))
    }
  
    // for material
    faces[i].push(0);
  }
  
  // for (var i=0; i<normals.length; i++) {
  //   console.log('passing normal: ' + normals[i][0] + ", " + normals[i][1] + ", " + normals[i][2]);
  // }
  // 
  // for (var i=0; i<vertexes.length; i++) {
  //   console.log('passing vertex: ' + vertexes[i][0] + ", " + vertexes[i][1] + ", " + vertexes[i][2]);
  // }
  // 
  // for (var i=0; i<faces.length; i++) {
  //   console.log('passing face: ' + faces[i][0] + ", " + faces[i][1] + ", " + faces[i][2]);
  // }
  // 
  // console.log("end");
  // document.getElementById('debug').innerHTML = STLString;
  
  // console.log("finished parsing stl")
  return [vertexes, normals, faces];
}
