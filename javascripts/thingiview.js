Thingiview = function(containerId) {
  scope = this;
  
  this.containerId  = containerId;
  var _container    = document.getElementById(containerId);
  
  var _stats    = null;
  var _camera   = null;
  var _scene    = null;
  var _renderer = null;
  var _object   = null;
  var _plane    = null;
  
  var _ambientLight     = null;
  var _directionalLight = null;
  var _pointLight       = null;
  
  var _targetRotation             = 0;
  var _targetRotationOnMouseDown  = 0;
  var _mouseX                     = 0;
  var _mouseXOnMouseDown          = 0;
  var _mouseDown                  = false;
  
  var _windowHalfX = window.innerWidth / 2;
  var _windowHalfY = window.innerHeight / 2

  var _view         = null;
  var _infoMessage  = null;
  
  var _timer        = null;
  var _rotateTimer  = null;

  this.showPlane = true;

  var _width  = parseFloat(document.defaultView.getComputedStyle(_container,null).getPropertyValue('width'));
  var _height = parseFloat(document.defaultView.getComputedStyle(_container,null).getPropertyValue('height'));  

  this.initScene = function() {
    _container.style.position = 'relative';
    _container.innerHTML      = '';

  	_infoMessage                  = document.createElement('div');
  	_infoMessage.style.position   = 'absolute';
  	_infoMessage.style.top        = '10px';
  	_infoMessage.style.width      = '100%';
  	_infoMessage.style.textAlign  = 'center';
  	_infoMessage.innerHTML        = 'Loading STL...';
  	_container.appendChild(_infoMessage);

  	_camera = new THREE.Camera(70, _width / _height, 1, 10000);
  	_scene  = new THREE.Scene();

    // load a blank object
    this.loadSTLString('');

    if (this.showPlane) {
  	  _plane = new THREE.Mesh(new Plane(100, 100, 10, 10), new THREE.MeshColorStrokeMaterial(0xafafaf, 0.5, 1));
      _plane.updateMatrix();
      // _plane.doubleSided = true;
      _scene.addObject(_plane);
    }

    // _ambientLight = new THREE.AmbientLight(0x80ffff);
    // _scene.addLight(_ambientLight);
    // 
    // _directionalLight = new THREE.DirectionalLight(0xffff00);
    // _scene.addLight(_directionalLight);

    // _ambientLight = new THREE.AmbientLight(Math.random() * 0x202020);
		_ambientLight = new THREE.AmbientLight(0x202020);
		_scene.addLight(_ambientLight);

    // _directionalLight = new THREE.DirectionalLight( Math.random() * 0xffffff);
    // _directionalLight.position.x = Math.random() - 0.5;
    // _directionalLight.position.y = Math.random() - 0.5;
    // _directionalLight.position.z = Math.random() - 0.5;
		_directionalLight = new THREE.DirectionalLight(0xffffff);
		_directionalLight.position.x = 0.5;
		_directionalLight.position.y = 0.5;
		_directionalLight.position.z = 0.5;
		_directionalLight.position.normalize();
		_scene.addLight(_directionalLight);

		_pointLight = new THREE.PointLight(0xff0000, 1);
		_scene.addLight(_pointLight);

    testCanvas = document.createElement('canvas');
    try {
      if (testCanvas.getContext('experimental-webgl')) {
        _renderer = new THREE.WebGLRenderer();
      } else {
        _renderer = new THREE.CanvasRenderer();
      }
    } catch(e) {
      _renderer = new THREE.CanvasRenderer();
    }
    
  	_renderer.setSize(_width, _height);
    _renderer.domElement.style.backgroundColor = '#606060';
  	_container.appendChild(_renderer.domElement);

    this.cameraView('diagonal');
    this.objectMaterial('solid');

  	_stats = new Stats();
  	_stats.domElement.style.position  = 'absolute';
  	_stats.domElement.style.top       = '0px';
  	_container.appendChild(_stats.domElement);

    // window.addEventListener('resize', _onContainerResize(), false);
    _container.addEventListener('resize', _onContainerResize(), false);


  	_renderer.domElement.addEventListener('mousemove',      _onRendererMouseMove,     false);    
    _renderer.domElement.addEventListener('mouseover',      _onRendererMouseOver,     false);
    _renderer.domElement.addEventListener('mouseout',       _onRendererMouseOut,      false);
  	_renderer.domElement.addEventListener('mousedown',      _onRendererMouseDown,     false);
    _renderer.domElement.addEventListener('mouseup',        _onRendererMouseUp,       false);

  	_renderer.domElement.addEventListener('touchstart',     _onRendererTouchStart,    false);
  	_renderer.domElement.addEventListener('touchend',       _onRendererTouchEnd,      false);
  	_renderer.domElement.addEventListener('touchmove',      _onRendererTouchMove,     false);

    _renderer.domElement.addEventListener('DOMMouseScroll', _onRendererScroll,        false);
  	_renderer.domElement.addEventListener('mousewheel',     _onRendererScroll,        false);
  	_renderer.domElement.addEventListener('gesturechange',  _onRendererGestureChange, false);
  }

  _onContainerResize = function(event) {
    _width  = parseFloat(document.defaultView.getComputedStyle(_container,null).getPropertyValue('width'));
    _height = parseFloat(document.defaultView.getComputedStyle(_container,null).getPropertyValue('height'));

    console.log("resized width: " + _width + ", height: " + _height);
  
    if (_renderer) {
      _renderer.setSize(_width, _height);
      _camera.projectionMatrix = THREE.Matrix4.makePerspective(70, _width / _height, 1, 10000);
      _sceneLoop();
    }    
  };
  
  _onRendererScroll = function(event) {
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
      scope.cameraZoom(+5);
    } else {
      // down
      scope.cameraZoom(-5);
    }
  }

  _onRendererGestureChange = function(event) {
    event.preventDefault();

    if (event.scale > 1) {
      scope.cameraZoom(+5);
    } else {
      scope.cameraZoom(-5);
    }
  }

  _onRendererMouseOver = function(event) {
    // console.log("over");
    _targetRotation = _object.rotation.z;
    _timer = setInterval(_sceneLoop, 1000/60);
  }

  _onRendererMouseDown = function(event) {
    // console.log("down");
  	_mouseDown = true;
  	event.preventDefault();
  	
  	clearInterval(_rotateTimer);
    _rotateTimer = null;
    
  	_mouseXOnMouseDown = event.clientX - _windowHalfX;
  	_targetRotationOnMouseDown = _targetRotation;
  }

  _onRendererMouseMove = function(event) {
    // console.log("move");
    if (_mouseDown) {
  	  _mouseX = event.clientX - _windowHalfX;
  	  _targetRotation = _targetRotationOnMouseDown + (_mouseX - _mouseXOnMouseDown) * 0.02;
	  }
  }

  _onRendererMouseUp = function(event) {
    // console.log("up");
    _mouseDown = false;
  }

  _onRendererMouseOut = function(event) {
    // console.log("out");
    clearInterval(_timer);
    _timer = null;
    _targetRotation = _object.rotation.z;
  }

  _onRendererTouchStart = function(event) {
    _targetRotation = _object.rotation.z;
    _timer = setInterval(_sceneLoop, 1000/60);

  	if (event.touches.length == 1) {
  		event.preventDefault();

  		_mouseXOnMouseDown = event.touches[0].pageX - _windowHalfX;
  		_targetRotationOnMouseDown = _targetRotation;
  	}
  }

  _onRendererTouchEnd = function(event) {
    clearInterval(_timer);
    _timer = null;
    _targetRotation = _object.rotation.z;
  }

  _onRendererTouchMove = function(event) {
  	if (event.touches.length == 1) {
  		event.preventDefault();

  		_mouseX = event.touches[0].pageX - _windowHalfX;
  		_targetRotation = _targetRotationOnMouseDown + (_mouseX - _mouseXOnMouseDown) * 0.05;
  	}
  }

  _sceneLoop = function() {
    if (_stats) {
      if (_view == 'bottom') {
        if (scope.showPlane) {
          _plane.rotation.z = _object.rotation.z -= (_targetRotation + _object.rotation.z) * 0.05;
        } else {
          _object.rotation.z -= (_targetRotation + _object.rotation.z) * 0.05;
        }
      } else {
        if (scope.showPlane) {
          _plane.rotation.z = _object.rotation.z += (_targetRotation - _object.rotation.z) * 0.05;
        } else {
          _object.rotation.z += (_targetRotation - _object.rotation.z) * 0.05;
        }
      }

      _camera.updateMatrix();
      _object.updateMatrix();
      _plane.updateMatrix();

    	_renderer.render(_scene, _camera);
    	_stats.update();
    }
  }

  _rotateLoop = function() {
    _targetRotation += 0.01;
    _sceneLoop();
  }

  this.toggleRotate = function() {
    if (_rotateTimer == null) {
      _rotateTimer = setInterval(_rotateLoop, 1000/60);
    } else {
      clearInterval(_rotateTimer);
      _rotateTimer = null;
    }
  }

  this.cameraView = function(dir) {
    _view = dir;
    
    if (dir == 'top') {
      _camera.position.y = 0;
      _camera.position.z = 100;
      if (this.showPlane) {
        _plane.flipSided = false;
      }
    } else if (dir == 'side') {
      _camera.position.y = 100;
      _camera.position.z = -0.1;
      if (this.showPlane) {
        _plane.flipSided = false;
      }
    } else if (dir == 'bottom') {
      _camera.position.y = 0;
      _camera.position.z = -100;
      if (this.showPlane) {
        _plane.flipSided = true;
      }
    } else {
      _camera.position.y = -70;
      _camera.position.z = 70;
      if (this.showPlane) {
        _plane.flipSided = false;
      }
    }

    _targetRotation     = 0;
    
    if (_object) {
      _object.rotation.z  = 0;
    }
    
    if (this.showPlane && _object) {
      _plane.rotation.z = _object.rotation.z;
    }

    _sceneLoop();
  }

  this.cameraZoom = function(factor) {
    if (_view == 'top') {
      _camera.position.z -= factor;
    } else if (_view == 'bottom') {
      _camera.position.z += factor;
    } else if (_view == 'side') {
      _camera.position.y -= factor;
    } else {
      _camera.position.y += factor;
      _camera.position.z -= factor;
    }

    _sceneLoop();
  }

  this.objectMaterial = function(type) {
  	_scene.removeObject(_object);
    if (type == 'wireframe') {
      _object = new THREE.Mesh(_geometry, new THREE.MeshColorStrokeMaterial(0x000, 1, 1));
      _object.updateMatrix();
  		_scene.addObject(_object);
    } else {
      _object = new THREE.Mesh(_geometry, new THREE.MeshColorFillMaterial(0xffffff));
      _object.updateMatrix();
  		_scene.addObject(_object);
    }

    _sceneLoop();
  }

  this.loadSTL = function(url) {
    BinaryAjax(
      url,
      function(http) {
        var mime = http.getResponseHeader("Content-Type");
        // console.log('mime type: ' + mime);
        var res = http.binaryResponse;

        if (typeof res.getRawData() == "string") {
          scope.loadSTLString(res.getRawData());
        } else {
          // scope.loadSTLBinary(res.getRawData());
        }
      },
      null,
      null      
    )
  }

  this.loadSTLString = function(STLString) {
    // console.log("STLString: \n" + STLString);

    _scene.removeObject(_object);

    _geometry = new STLGeometry(STLString);

    // rand = Math.random() * 0.5;
    // for (var i = 0; i < _geometry.faces.length; i++) {
    //       _geometry.faces[i].color.setRGBA(Math.random() * 0.5, Math.random() * 0.5 + 0.5, 1, 1);
    //       // _geometry.faces[i].color.setRGBA(rand, rand + 0.5, 1, 1);
    // }

    // _object = new THREE.Mesh(_geometry, new THREE.MeshFaceColorFillMaterial());
    _object = new THREE.Mesh(_geometry, new THREE.MeshColorFillMaterial(0xffffff));
    // _object = new THREE.Mesh(_geometry, new THREE.MeshFaceColorFillMaterial());
    // _object.doubleSided = true;
    // _object.overDraw = true;
    _object.updateMatrix();
  	_scene.addObject(_object);

    _infoMessage.innerHTML = 'Finished Loading ' + _geometry.faces.length + ' faces';

    _sceneLoop();
  }
  
  this.loadOBJString = function(OBJString) {
    alert('not implemented')
  }
};

var STLGeometry = function(STLString) {
	THREE.Geometry.call(this);

	var scope = this;

  var STLInfo  = ParseSTL(STLString);
  var vertexes = STLInfo[0];
  var normals  = STLInfo[1];
  var faces    = STLInfo[2];

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

// build stl's vertex and face arrays
function ParseSTL(STLString) {
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
