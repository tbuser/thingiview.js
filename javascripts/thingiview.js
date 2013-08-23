var Thingiview = function(containerId, gridsize, gridunit) {
  this.scope = this;
  this.containerId  = containerId;
  this.gridsize = gridsize;
  this.gridunit = gridunit;
  this.init();
}

Thingiview.prototype.init = function() {
  this.container     = document.getElementById(this.containerId);
  
  // this.stats    = null;
  this.camera   = null;
  this.scene    = null;
  this.renderer = null;
  this.object   = null;
  this.plane    = null;
  
  this.ambientLight     = null;
  this.directionalLight = null;
  this.pointLight       = null;
  
  this.targetXRotation             = 0;
  this.targetXRotationOnMouseDown  = 0;
  this.mouseX                      = 0;
  this.mouseXOnMouseDown           = 0;

  this.targetYRotation             = 0;
  this.targetYRotationOnMouseDown  = 0;
  this.mouseY                      = 0;
  this.mouseYOnMouseDown           = 0;

  this.mouseDown                  = false;
  this.mouseOver                  = false;
  
  this.windowHalfX = window.innerWidth / 2;
  this.windowHalfY = window.innerHeight / 2

  this.view         = null;
  this.infoMessage  = null;
  this.progressBar  = null;
  this.alertBox     = null;
  
  this.timer        = null;

  this.rotateTimer    = null;
  this.rotateListener = null;
  this.wasRotating    = null;

  this.cameraView = 'diagonal';
  this.cameraZoom = 0;
  this.rotate = false;
  this.backgroundColor = '#606060';
  this.objectMaterial = 'solid';
  this.objectColor = 0xffffff;
  this.showPlane = true;
  this.isWebGl = false;

  if (document.defaultView && document.defaultView.getComputedStyle) {
    this.width  = parseFloat(document.defaultView.getComputedStyle(this.container,null).getPropertyValue('width'));
    this.height = parseFloat(document.defaultView.getComputedStyle(this.container,null).getPropertyValue('height'));  
  } else {
    this.width  = parseFloat(this.container.currentStyle.width);
    this.height = parseFloat(this.container.currentStyle.height);
  }

  this.geometry;
}

Thingiview.prototype.initScene = function() {
    this.container.style.position = 'relative';
    this.container.innerHTML      = '';

  	this.camera = new THREE.PerspectiveCamera(45, this.width/ this.height, 1, 100000);
  	this.camera.updateMatrix();
    this.camera.target = new THREE.Vector3(0, 0, 0);

  	this.scene  = new THREE.Scene();

    this.ambientLight = new THREE.AmbientLight(0x202020);
    this.scene.add(this.ambientLight);
    
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.75);
    this.directionalLight.position.x = 1;
    this.directionalLight.position.y = 1;
    this.directionalLight.position.z = 2;
    this.directionalLight.position.normalize();
    this.scene.add(this.directionalLight);
    
    this.pointLight = new THREE.PointLight(0xffffff, 0.3);
    this.pointLight.position.x = 0;
    this.pointLight.position.y = -25;
    this.pointLight.position.z = 10;
    this.scene.add(this.pointLight);

    progressBar = document.createElement('div');
    progressBar.style.position = 'absolute';
    progressBar.style.top = '0px';
    progressBar.style.left = '0px';
    progressBar.style.backgroundColor = 'red';
    progressBar.style.padding = '5px';
    progressBar.style.display = 'none';
    progressBar.style.overflow = 'visible';
    progressBar.style.whiteSpace = 'nowrap';
    progressBar.style.zIndex = 100;
    this.container.appendChild(progressBar);
    
    alertBox = document.createElement('div');
    alertBox.id = 'alertBox';
    alertBox.style.position = 'absolute';
    alertBox.style.top = '25%';
    alertBox.style.left = '25%';
    alertBox.style.width = '50%';
    alertBox.style.height = '50%';
    alertBox.style.backgroundColor = '#dddddd';
    alertBox.style.padding = '10px';
    // alertBox.style.overflowY = 'scroll';
    alertBox.style.display = 'none';
    alertBox.style.zIndex = 100;
    this.container.appendChild(alertBox);
    
    // load a blank object
    // this.loadSTLString('');

    if (this.showPlane) {
      this.loadPlaneGeometry();
    }
    
    this.setCameraView(this.cameraView);
    this.setObjectMaterial(this.objectMaterial);

    testCanvas = document.createElement('canvas');
    try {
      if (testCanvas.getContext('experimental-webgl')) {
        // this.showPlane = false;
        isWebGl = true;
        this.renderer = new THREE.WebGLRenderer();
        // this.renderer = new THREE.CanvasRenderer();
      } else {
        this.renderer = new THREE.CanvasRenderer();
      }
    } catch(e) {
      this.renderer = new THREE.CanvasRenderer();
      // log("failed webgl detection");
    }

    // this.renderer.setSize(this.container.innerWidth, this.container.innerHeight);

  	this.renderer.setSize(this.width, this.height);
    this.renderer.domElement.style.backgroundColor = backgroundColor;
  	this.container.appendChild(this.renderer.domElement);

    // stats = new Stats();
    // stats.domElement.style.position  = 'absolute';
    // stats.domElement.style.top       = '0px';
    // this.container.appendChild(stats.domElement);

    // TODO: figure out how to get the render window to resize when window resizes
    // window.addEventListener('resize', onContainerResize(), false);
    // this.container.addEventListener('resize', onContainerResize(), false);

    // this.renderer.domElement.addEventListener('mousemove',      onRendererMouseMove,     false);    
  	window.addEventListener('mousemove', (function(self) {
                                  return function(event) {
                                    self.onRendererMouseMove(event);
                                  }
                                 })(this),     false);    
    this.renderer.domElement.addEventListener('mouseover', (function(self) {
                                  return function(event) {
                                    self.onRendererMouseOver(event);
                                  }
                                 })(this),     false);
    this.renderer.domElement.addEventListener('mouseout', (function(self) {
                                  return function(event) {
                                    self.onRendererMouseOut(event);
                                  }
                                 })(this),      false);
  	this.renderer.domElement.addEventListener('mousedown', (function(self) {
                                  return function(event) {
                                    self.onRendererMouseDown(event);
                                  }
                                 })(this),     false);
    // this.renderer.domElement.addEventListener('mouseup',        this.onRendererMouseUp,       false);
    window.addEventListener('mouseup', (function(self) {
                                  return function(event) {
                                    self.onRendererMouseUp(event);
                                  }
                                 })(this),       false);

  	this.renderer.domElement.addEventListener('touchstart', (function(self) {
                                  return function(event) {
                                    self.onRendererTouchStart(event);
                                  }
                                 })(this),    false);
  	this.renderer.domElement.addEventListener('touchend', (function(self) {
                                  return function(event) {
                                    self.onRendererTouchEnd(event);
                                  }
                                 })(this),      false);
  	this.renderer.domElement.addEventListener('touchmove', (function(self) {
                                  return function(event) {
                                    self.onRendererTouchMove(event);
                                  }
                                 })(this),     false);

    this.renderer.domElement.addEventListener('DOMMouseScroll', (function(self) {
                                  return function(event) {
                                    self.onRendererScroll(event);
                                  }
                                 })(this),        false);
  	this.renderer.domElement.addEventListener('mousewheel', (function(self) {
                                  return function(event) {
                                    self.onRendererScroll(event);
                                  }
                                 })(this),        false);
  	this.renderer.domElement.addEventListener('gesturechange', (function(self) {
                                  return function(event) {
                                    self.onRendererGestureChange(event);
                                  }
                                 })(this), false);
  }

  // FIXME
  // onContainerResize = function(event) {
  //   width  = parseFloat(document.defaultView.getComputedStyle(this.container,null).getPropertyValue('width'));
  //   height = parseFloat(document.defaultView.getComputedStyle(this.container,null).getPropertyValue('height'));
  // 
  //   // log("resized width: " + width + ", height: " + height);
  // 
  //   if (this.renderer) {
  //     this.renderer.setSize(width, height);
  //     camera.projectionMatrix = THREE.Matrix4.makePerspective(70, width / height, 1, 10000);
  //     this.sceneLoop();
  //   }    
  // };
  
Thingiview.prototype.onRendererScroll = function(event) {
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
      this.scope.setCameraZoom(+10);
    } else {
      // down
      this.scope.setCameraZoom(-10);
    }
  }

Thingiview.prototype.onRendererGestureChange = function(event) {
    event.preventDefault();

    if (event.scale > 1) {
      this.scope.setCameraZoom(+5);
    } else {
      this.scope.setCameraZoom(-5);
    }
  }

Thingiview.prototype.onRendererMouseOver = function(event) {
    this.mouseOver = true;
    // targetRotation = object.rotation.z;
    if (this.timer == null) {
      // log('starting loop');
      this.timer = setInterval((function(self) {
                                  return function() {
                                    self.sceneLoop();
                                  }
                                 })(this), 1000/60);
    }
  }

Thingiview.prototype.onRendererMouseDown = function(event) {
    // log("down");

    event.preventDefault();
  	this.mouseDown = true;
    
    if(this.scope.getRotation()){
      this.wasRotating = true;
      this.setRotation(false);
    } else {
      this.wasRotating = false;
    }
    
  	mouseXOnMouseDown = event.clientX - this.windowHalfX;
  	mouseYOnMouseDown = event.clientY - this.windowHalfY;

  	this.targetXRotationOnMouseDown = this.targetXRotation;
  	this.targetYRotationOnMouseDown = this.targetYRotation;
  }

Thingiview.prototype.onRendererMouseMove = function(event) {
    // log("move");

    if (this.mouseDown) {
  	  mouseX = event.clientX - this.windowHalfX;
      // this.targetXRotation = this.targetXRotationOnMouseDown + (mouseX - mouseXOnMouseDown) * 0.02;
  	  xrot = this.targetXRotationOnMouseDown + (mouseX - mouseXOnMouseDown) * 0.02;

  	  mouseY = event.clientY - this.windowHalfY;
      // this.targetYRotation = this.targetYRotationOnMouseDown + (mouseY - mouseYOnMouseDown) * 0.02;
  	  yrot = this.targetYRotationOnMouseDown + (mouseY - mouseYOnMouseDown) * 0.02;
  	  
  	  this.targetXRotation = xrot;
  	  this.targetYRotation = yrot;
	  }
  }

Thingiview.prototype.onRendererMouseUp = function(event) {
    // log("up");
    if (this.mouseDown) {
      this.mouseDown = false;
      if (!this.mouseOver) {
        clearInterval(this.timer);
        this.timer = null;
      }
      if (this.wasRotating) {
        this.setRotation(true);
      }
    }
  }

Thingiview.prototype.onRendererMouseOut = function(event) {
    if (!this.mouseDown) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.mouseOver = false;
  }

Thingiview.prototype.onRendererTouchStart = function(event) {
    this.targetXRotation = this.object.rotation.z;
    this.targetYRotation = this.object.rotation.x;

    this.timer = setInterval((function(self) {
                                return function() {
                                  self.sceneLoop();
                                }
                               })(this), 1000/60);

  	if (event.touches.length == 1) {
  		event.preventDefault();

  		mouseXOnMouseDown = event.touches[0].pageX - this.windowHalfX;
  		this.targetXRotationOnMouseDown = this.targetXRotation;

  		mouseYOnMouseDown = event.touches[0].pageY - this.windowHalfY;
  		this.targetYRotationOnMouseDown = this.targetYRotation;
  	}
  }

Thingiview.prototype.onRendererTouchEnd = function(event) {
    clearInterval(this.timer);
    this.timer = null;
    // this.targetXRotation = this.object.rotation.z;
    // this.targetYRotation = this.object.rotation.x;
  }

Thingiview.prototype.onRendererTouchMove = function(event) {
  	if (event.touches.length == 1) {
  		event.preventDefault();

  		mouseX = event.touches[0].pageX - this.windowHalfX;
  		this.targetXRotation = this.targetXRotationOnMouseDown + (mouseX - mouseXOnMouseDown) * 0.05;

  		mouseY = event.touches[0].pageY - this.windowHalfY;
  		this.targetYRotation = this.targetYRotationOnMouseDown + (mouseY - mouseYOnMouseDown) * 0.05;
  	}
  }

Thingiview.prototype.sceneLoop = function() {
    if (this.object) {
      // if (view == 'bottom') {
      //   if (this.showPlane) {
      //     this.plane.rotation.z = this.object.rotation.z -= (targetRotation + this.object.rotation.z) * 0.05;
      //   } else {
      //     this.object.rotation.z -= (targetRotation + this.object.rotation.z) * 0.05;
      //   }
      // } else {
      //   if (this.showPlane) {
      //     this.plane.rotation.z = this.object.rotation.z += (targetRotation - this.object.rotation.z) * 0.05;
      //   } else {
      //     this.object.rotation.z += (targetRotation - this.object.rotation.z) * 0.05;
      //   }
      // }

      if (this.showPlane) {
        this.plane.rotation.z = this.object.rotation.z = (this.targetXRotation - this.object.rotation.z) * 0.2;
        this.plane.rotation.x = this.object.rotation.x = (this.targetYRotation - this.object.rotation.x) * 0.2;
      } else {
        this.object.rotation.z = (this.targetXRotation - this.object.rotation.z) * 0.2;
        this.object.rotation.x = (this.targetYRotation - this.object.rotation.x) * 0.2;
      }

      // log(this.object.rotation.x);

      this.camera.lookAt(this.camera.target);
      this.camera.updateMatrix();
      this.object.updateMatrix();

      if (this.showPlane) {
        this.plane.updateMatrix();
      }

    	this.renderer.render(this.scene, this.camera);
      // stats.update();
    }
  }

Thingiview.prototype.rotateLoop = function() {
    // targetRotation += 0.01;
    this.targetXRotation += 0.05;
    this.sceneLoop();
  }

Thingiview.prototype.getShowPlane = function(){
    return this.showPlane;
  }

Thingiview.prototype.setShowPlane = function(show) {
    this.showPlane = show;
    
    if (show) {
      if (this.scene && !this.plane) {
        this.loadPlaneGeometry();
      }
      this.plane.material[0].opacity = 1;
      // this.plane.updateMatrix();
    } else {
      if (this.scene && this.plane) {
        // alert(this.plane.material[0].opacity);
        this.plane.material[0].opacity = 0;
        // this.plane.updateMatrix();
      }
    }
    
    this.sceneLoop();
  }

Thingiview.prototype.getRotation = function() {
    return this.rotateTimer !== null;
  }

Thingiview.prototype.setRotation = function(rotate) {
    rotation = rotate;
    
    if (rotate) {
      this.rotateTimer = setInterval((function(self) {
                                        return function() {
                                          self.rotateLoop();
                                        }
                                       })(this), 1000/60);
    } else {
      clearInterval(this.rotateTimer);
      this.rotateTimer = null;
    }

    this.scope.onSetRotation();
  }

Thingiview.prototype.onSetRotation = function(callback) {
    if(callback === undefined){
      if(this.rotateListener !== null){
        try{
          this.rotateListener(this.scope.getRotation());
        } catch(ignored) {}
      }
    } else {
      this.rotateListener = callback;
    }
  }

Thingiview.prototype.setCameraView = function(dir) {
    this.cameraView = dir;

    this.targetXRotation       = 0;
    this.targetYRotation       = 0;

    if (this.object) {
      this.object.rotation.x = 0;
      this.object.rotation.y = 0;
      this.object.rotation.z = 0;
    }

    if (this.showPlane && this.object) {
      this.plane.rotation.x = this.object.rotation.x;
      this.plane.rotation.y = this.object.rotation.y;
      this.plane.rotation.z = this.object.rotation.z;
    }
    
    if (dir == 'top') {
      // camera.position.y = 0;
      // this.camera.position.z = 100;
      // this.camera.target.z = 0;
      if (this.showPlane) {
        this.plane.flipSided = false;
      }
    } else if (dir == 'side') {
      // this.camera.position.y = -70;
      // this.camera.position.z = 70;
      // this.camera.target.z = 0;
      this.targetYRotation = -4.5;
      if (this.showPlane) {
        this.plane.flipSided = false;
      }
    } else if (dir == 'bottom') {
      // this.camera.position.y = 0;
      // this.camera.position.z = -100;
      // this.camera.target.z = 0;
      if (this.showPlane) {
        this.plane.flipSided = true;
      }
    } else {
      // this.camera.position.y = -70;
      // this.camera.position.z = 70;
      // this.camera.target.z = 0;
      if (this.showPlane) {
        this.plane.flipSided = false;
      }
    }

    mouseX            = this.targetXRotation;
    mouseXOnMouseDown = this.targetXRotation;
    
    mouseY            = this.targetYRotation;
    mouseYOnMouseDown = this.targetYRotation;
    
    this.scope.centerCamera();
    
    this.sceneLoop();
  }

Thingiview.prototype.setCameraZoom = function(factor) {
    this.cameraZoom = factor;
    
    if (this.cameraView == 'bottom') {
      if (this.camera.position.z + factor > 0) {
        factor = 0;
      }
    } else {
      if (this.camera.position.z - factor < 0) {
        factor = 0;
      }
    }
    
    if (this.cameraView == 'top') {
      this.camera.position.z -= factor;
    } else if (this.cameraView == 'bottom') {
      this.camera.position.z += factor;
    } else if (this.cameraView == 'side') {
      this.camera.position.y += factor;
      this.camera.position.z -= factor;
    } else {
      this.camera.position.y += factor;
      this.camera.position.z -= factor;
    }

    this.sceneLoop();
  }

Thingiview.prototype.getObjectMaterial = function() {
    return this.objectMaterial;
  }

Thingiview.prototype.setObjectMaterial = function(type) {
    this.objectMaterial = type;

    this.loadObjectGeometry();
  }

Thingiview.prototype.setBackgroundColor = function(color) {
    backgroundColor = color
    
    if (this.renderer) {
      this.renderer.domElement.style.backgroundColor = color;
    }
  }

Thingiview.prototype.setObjectColor = function(color) {
    this.objectColor = parseInt(color.replace(/\#/g, ''), 16);
    
    this.loadObjectGeometry();
  }

Thingiview.prototype.loadSTL = function(url) {
    this.scope.newWorker('loadSTL', url);
  }

Thingiview.prototype.loadOBJ = function(url) {
    this.scope.newWorker('loadOBJ', url);
  }
  
Thingiview.prototype.loadSTLString = function(STLString) {
    this.scope.newWorker('loadSTLString', STLString);
  }
  
Thingiview.prototype.loadSTLBinary = function(STLBinary) {
    this.scope.newWorker('loadSTLBinary', STLBinary);
  }
  
Thingiview.prototype.loadOBJString = function(OBJString) {
    this.scope.newWorker('loadOBJString', OBJString);
  }

Thingiview.prototype.loadJSON = function(url) {
    this.scope.newWorker('loadJSON', url);
  }

Thingiview.prototype.loadPLY = function(url) {
    this.scope.newWorker('loadPLY', url);
  }
  
Thingiview.prototype.loadPLYString = function(PLYString) {
    this.scope.newWorker('loadPLYString', PLYString);
  }

Thingiview.prototype.loadPLYBinary = function(PLYBinary) {
    this.scope.newWorker('loadPLYBinary', PLYBinary);
  }

Thingiview.prototype.centerCamera = function() {
    if (this.geometry) {
      // Using method from http://msdn.microsoft.com/en-us/library/bb197900(v=xnagamestudio.10).aspx
      // log("bounding sphere radius = " + this.geometry.boundingSphere.radius);

      // look at the center of the object
      this.camera.target.x = this.geometry.center_x;
      this.camera.target.y = this.geometry.center_y;
      this.camera.target.z = this.geometry.center_z;

      // set camera position to center of sphere
      this.camera.position.x = this.geometry.center_x;
      this.camera.position.y = this.geometry.center_y;
      this.camera.position.z = this.geometry.center_z;

      // find distance to center
      distance = this.geometry.boundingSphere.radius / Math.sin((this.camera.fov/2) * (Math.PI / 180));

      // zoom backwards about half that distance, I don't think I'm doing the math or backwards vector calculation correctly?
      // this.scope.setCameraZoom(-distance/1.8);
      // this.scope.setCameraZoom(-distance/1.5);
      this.scope.setCameraZoom(-distance/1.9);

      this.directionalLight.position.x = this.geometry.min_y * 2;
      this.directionalLight.position.y = this.geometry.min_y * 2;
      this.directionalLight.position.z = this.geometry.max_z * 2;

      this.pointLight.position.x = this.geometry.center_y;
      this.pointLight.position.y = this.geometry.center_y;
      this.pointLight.position.z = this.geometry.max_z * 2;
    } else {
      // set to any valid position so it doesn't fail before geometry is available
      this.camera.position.y = -70;
      this.camera.position.z = 70;
      this.camera.target.z = 0;
    }
  }

Thingiview.prototype.loadArray = function(array) {
    log("loading array...");
    this.geometry = new STLGeometry(array);
    this.loadObjectGeometry();
    this.setRotation(false);
    this.setRotation(true);
    this.centerCamera();
    log("finished loading " + this.geometry.faces.length + " faces.");
  }

Thingiview.prototype.newWorker = function(cmd, param) {
    this.setRotation(false);
  	
    var worker = new WorkerFacade(thingiurlbase + '/thingiloader.js');
    worker.scope = this;
    
    worker.onmessage = function(event) {
      if (event.data.status == "complete") {
        progressBar.innerHTML = 'Initializing geometry...';
        // this.scene.removeObject(this.object);
        this.scope.geometry = new STLGeometry(event.data.content);
        this.scope.loadObjectGeometry();
        progressBar.innerHTML = '';
        progressBar.style.display = 'none';

        this.scope.setRotation(false);
        this.scope.setRotation(true);
        log("finished loading " + this.scope.geometry.faces.length + " faces.");
        this.scope.centerCamera();
      } else if (event.data.status == "complete_points") {
        progressBar.innerHTML = 'Initializing points...';

        this.scope.geometry = new THREE.Geometry();

        var material = new THREE.ParticleBasicMaterial( { color: 0xff0000, opacity: 1 } );

        // material = new THREE.ParticleBasicMaterial( { size: 35, sizeAttenuation: false} );
        // material.color.setHSV( 1.0, 0.2, 0.8 );
        
        for (i in event.data.content[0]) {
        // for (var i=0; i<10; i++) {
          vector = new THREE.Vector3( event.data.content[0][i][0], event.data.content[0][i][1], event.data.content[0][i][2] );
          this.scope.geometry.vertices.push(vector);
        }

        particles = new THREE.ParticleSystem( this.geometry, material );
        particles.sortParticles = true;
        particles.updateMatrix();
        this.scope.scene.add( particles );
                                
        this.scope.camera.lookAt(this.camera.target);
        this.scope.camera.updateMatrix();
        this.scope.renderer.render(this.scene, this.camera);
        
        progressBar.innerHTML = '';
        progressBar.style.display = 'none';

        this.scope.setRotation(false);
        this.scope.setRotation(true);
        log("finished loading " + event.data.content[0].length + " points.");
        // this.scope.centerCamera();
      } else if (event.data.status == "progress") {
        progressBar.style.display = 'block';
        progressBar.style.width = event.data.content;
        // log(event.data.content);
      } else if (event.data.status == "message") {
        progressBar.style.display = 'block';
        progressBar.innerHTML = event.data.content;
        log(event.data.content);
      } else if (event.data.status == "alert") {
        this.scope.displayAlert(event.data.content);
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

Thingiview.prototype.displayAlert = function(msg) {
    msg = msg + "<br/><br/><center><input type=\"button\" value=\"Ok\" onclick=\"document.getElementById('alertBox').style.display='none'\"></center>"
    
    alertBox.innerHTML = msg;
    alertBox.style.display = 'block';
    
    // log(msg);
  }

Thingiview.prototype.loadPlaneGeometry = function() {
    // TODO: switch to lines instead of the Plane object so we can get rid of the horizontal lines in canvas renderer...
    this.plane = new THREE.Mesh(new THREE.PlaneGeometry(this.gridsize, this.gridsize, this.gridunit, this.gridunit), new THREE.MeshBasicMaterial({color:0xafafaf,wireframe:true}));
    this.scene.add(this.plane);
  }

Thingiview.prototype.loadObjectGeometry = function() {
    if (this.scene && this.geometry) {
      if (this.objectMaterial == 'wireframe') {
        // material = new THREE.MeshColorStrokeMaterial(this.objectColor, 1, 1);
        material = new THREE.MeshBasicMaterial({color:this.objectColor,wireframe:true});
      } else {
        if (isWebGl) {
          // material = new THREE.MeshPhongMaterial(this.objectColor, this.objectColor, 0xffffff, 50, 1.0);
          // material = new THREE.MeshColorFillMaterial(this.objectColor);
          // material = new THREE.MeshLambertMaterial({color:this.objectColor});
          material = new THREE.MeshLambertMaterial({color:this.objectColor, shading: THREE.FlatShading});
        } else {
          // material = new THREE.MeshColorFillMaterial(this.objectColor);
          material = new THREE.MeshLambertMaterial({color:this.objectColor, shading: THREE.FlatShading});
        }
      }

      // scene.removeObject(this.object);      

      if (this.object) {
        // shouldn't be needed, but this fixes a bug with webgl not removing previous object when loading a new one dynamically
        this.object.materials = [new THREE.MeshBasicMaterial({color:0xffffff, opacity:0})];
        this.scene.removeObject(this.object);        
        // this.object.geometry = geometry;
        // this.object.materials = [material];
      }

      this.object = new THREE.Mesh(this.geometry, material);
  		this.scene.add(this.object);

      if (this.objectMaterial != 'wireframe') {
        this.object.overdraw = true;
        this.object.doubleSided = true;
      }
      
      this.object.updateMatrix();
    
      this.targetXRotation = 0;
      this.targetYRotation = 0;

      this.sceneLoop();
    }
  }

var STLGeometry = function(stlArray) {
  // log("building geometry...");
	THREE.Geometry.call(this);

	var scope = this;

  // var vertexes = stlArray[0];
  // var normals  = stlArray[1];
  // var faces    = stlArray[2];

  for (var i=0; i<stlArray[0].length; i++) {    
    v(stlArray[0][i][0], stlArray[0][i][1], stlArray[0][i][2]);
  }

  for (var i=0; i<stlArray[1].length; i++) {
    f3(stlArray[1][i][0], stlArray[1][i][1], stlArray[1][i][2]);
  }

  function v(x, y, z) {
    // log("adding vertex: " + x + "," + y + "," + z);
    scope.vertices.push( new THREE.Vector3( x, y, z ) );
  }

  function f3(a, b, c) {
    // log("adding face: " + a + "," + b + "," + c)
    scope.faces.push( new THREE.Face3( a, b, c ) );
  }

  // log("computing centroids...");
  this.computeCentroids();
  // log("computing normals...");
  // this.computeNormals();
	this.computeFaceNormals();
  // log("finished building geometry");

  scope.min_x = 0;
  scope.min_y = 0;
  scope.min_z = 0;
  
  scope.max_x = 0;
  scope.max_y = 0;
  scope.max_z = 0;
  
  for (var v = 0, vl = scope.vertices.length; v < vl; v ++) {
		scope.max_x = Math.max(scope.max_x, scope.vertices[v].x);
		scope.max_y = Math.max(scope.max_y, scope.vertices[v].y);
		scope.max_z = Math.max(scope.max_z, scope.vertices[v].z);
		                                    
		scope.min_x = Math.min(scope.min_x, scope.vertices[v].x);
		scope.min_y = Math.min(scope.min_y, scope.vertices[v].y);
		scope.min_z = Math.min(scope.min_z, scope.vertices[v].z);
}

  scope.center_x = (scope.max_x + scope.min_x)/2;
  scope.center_y = (scope.max_y + scope.min_y)/2;
  scope.center_z = (scope.max_z + scope.min_z)/2;
}

STLGeometry.prototype = new THREE.Geometry();
STLGeometry.prototype.constructor = STLGeometry;

function log(msg) {
  if (console) {
    console.log(msg);
  }
}

/* A facade for the Web Worker API that fakes it in case it's missing. 
Good when web workers aren't supported in the browser, but it's still fast enough, so execution doesn't hang too badly (e.g. Opera 10.5).
By Stefan Wehrmeyer, licensed under MIT
*/

var WorkerFacade;
if(!!window.Worker){
    WorkerFacade = (function(){
        return function(path){
            return new window.Worker(path);
        };
    }());
} else {
    WorkerFacade = (function(){
        var workers = {}, masters = {}, loaded = false;
        var that = function(path){
            var theworker = {}, loaded = false, callings = [];
            theworker.postToWorkerFunction = function(args){
                try{
                    workers[path]({"data":args});
                }catch(err){
                    theworker.onerror(err);
                }
            };
            theworker.postMessage = function(params){
                if(!loaded){
                    callings.push(params);
                    return;
                }
                theworker.postToWorkerFunction(params);
            };
            masters[path] = theworker;
            var scr = document.createElement("SCRIPT");
            scr.src = path;
            scr.type = "text/javascript";
            scr.onload = function(){
                loaded = true;
                while(callings.length > 0){
                    theworker.postToWorkerFunction(callings[0]);
                    callings.shift();
                }
            };
            document.body.appendChild(scr);
            
            var binaryscr = document.createElement("SCRIPT");
            binaryscr.src = thingiurlbase + '/binaryReader.js';
            binaryscr.type = "text/javascript";
            document.body.appendChild(binaryscr);
            
            return theworker;
        };
        that.fake = true;
        that.add = function(pth, worker){
            workers[pth] = worker;
            return function(param){
                masters[pth].onmessage({"data": param});
            };
        };
        that.toString = function(){
            return "FakeWorker('"+path+"')";
        };
        return that;
    }());
}

/* Then just use WorkerFacade instead of Worker (or alias it)

The Worker code must should use a custom function (name it how you want) instead of postMessage.
Put this at the end of the Worker:

if(typeof(window) === "undefined"){
    onmessage = nameOfWorkerFunction;
    customPostMessage = postMessage;
} else {
    customPostMessage = WorkerFacade.add("path/to/thisworker.js", nameOfWorkerFunction);
}

*/
