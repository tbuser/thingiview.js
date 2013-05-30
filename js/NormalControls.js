/**
 * @author graphicsforge
 */

THREE.NormalControls = function ( camera, domElement ) {
	this.target = new THREE.Vector3(0,0,0);
  this.camera = camera;
  this.element = domElement;
  this.camera.lookAt( this.target );
  this.keyboard = [];
  this.mouseButton = [];
  this.prevMousePos = [0,0];
  this.desiredCameraPosition = undefined;
  this.desiredCameraTarget = undefined;

	this.minDistance = 0.5;
	this.maxDistance = Infinity;
  this.n00bMode = true;
  this.dirty = true;
  // add event listeners
  this.addEventListeners();
}

THREE.NormalControls.prototype.update = function( timeElapsed ) {
  if ( this.n00bMode ) {
    // clear out roll
    var roll = this.getRoll();
    if ( Math.abs(roll)<0.4 )
    {
      var rotation = new THREE.Matrix4();
      rotation.makeRotationAxis( this.target.clone().sub(this.camera.position).normalize(), -roll );
      this.camera.up.applyMatrix4( rotation );
    }
  }

  timeElapsed = Math.min(timeElapsed, 50);
  if ( this.desiredCameraPosition != undefined )
  {
    var diff = this.desiredCameraPosition.clone().sub(this.camera.position);
    var length = diff.length();
    if ( length>0.1 )
      diff.multiplyScalar( Math.min(Math.max(timeElapsed/100, 0.01), 1) );
    else
      this.desiredCameraPosition = undefined;
    this.camera.position.add(diff);
  }
  if ( this.desiredCameraTarget != undefined )
  {
    var diff = this.desiredCameraTarget.clone().sub(this.target);
    var length = diff.length();
    if ( length>0.1 )
      diff.multiplyScalar( Math.min(Math.max(timeElapsed/100, 0.01), 1) );
    else
      this.desiredCameraTarget = undefined;
    this.target.add(diff);
  }

  this.camera.lookAt( this.target );
}

THREE.NormalControls.prototype.addEventListeners = function() {
  var self = this;
  this.element.addEventListener('mousemove', function(event){
    self.onMouseMove(event);
    self.updateMousePos(event);
  }, false);
  this.element.addEventListener('mousedown', function(event){
    self.mouseButton[event.button]=true;
    self.updateMousePos(event);
    self.desiredCameraPosition = undefined;
    self.desiredCameraTarget = undefined;
  }, false);
  this.element.addEventListener('mouseup', function(event){
    self.mouseButton[event.button]=false;
    self.updateMousePos(event);
    self.desiredCameraPosition = undefined;
    self.desiredCameraTarget = undefined;
  }, false);
  this.element.addEventListener('mouseover', function(event){
    self.updateMousePos(event);
  }, false);
  this.element.addEventListener('mouseout', function(event){
    // button state is invalid outside of iframe
    for ( var i=0; i<self.mouseButton.length; i++ )
      self.mouseButton[i] = false;
    self.updateMousePos(event);
  }, false);
  this.element.addEventListener('mousewheel', function(event){
    self.mouseWheel(event);
    self.desiredCameraPosition = undefined;
    event.preventDefault();
    return false;
  }, false);
  this.element.addEventListener('DOMMouseScroll', function(event){
    self.mouseWheel(event);
    self.desiredCameraPosition = undefined;
    event.preventDefault();
    return false;
  }, false);
  this.element.addEventListener('gesturechange', function(event){
    if ( event.scale>1 )
      event.wheelDelta = 1;
    else
      event.wheelDelta = -1;
    self.desiredCameraPosition = undefined;
    self.mouseWheel(event);
    event.preventDefault();
    return false;
  }, false);
  this.element.addEventListener('contextmenu', function(event){
    event.preventDefault();
    return false;
  }, false);
  window.addEventListener('keydown', function(event){
    self.keyboard[event.which]=true;
  }, false);
  window.addEventListener('keyup', function(event){
    self.keyboard[event.which]=false;
  }, false);
}

THREE.NormalControls.prototype.mouseWheel = function(event) {
  var rolled = 0;
  if (event.wheelDelta === undefined)
    rolled = -40 * event.detail;
  else
    rolled = event.wheelDelta;
  this.zoom( rolled*0.001 );
  this.dirty = true;
}

THREE.NormalControls.prototype.updateMousePos = function(event) {
  if ( event.clientX===undefined || event.clientY===undefined )
    return;
  this.prevMousePos[0] = event.clientX;
  this.prevMousePos[1] = event.clientY;
}

THREE.NormalControls.prototype.onMouseMove = function(event) {
  var mouseMotion = [event.clientX-this.prevMousePos[0], event.clientY-this.prevMousePos[1]];
  // 'r' key
  if ( this.mouseButton[0]&&this.keyboard[82] )
  {
    // this is how we roll
    var rotation = new THREE.Matrix4();
    rotation.makeRotationAxis( this.target.clone().sub(this.camera.position).normalize(), mouseMotion[0]*.005 );
    this.camera.up.applyMatrix4( rotation );
  }
  // right-mouse or shift key
  else if ( this.mouseButton[2] || ( this.mouseButton[0]&&this.keyboard[16] ) )
  {
    // pan controls
    var scaleFactor = 0.01 * Math.pow(this.target.clone().sub(this.camera.position).lengthSq(), 1/3);
    scaleFactor = Math.max(scaleFactor, 0.01);
    this.translate( new THREE.Vector3(mouseMotion[0]*scaleFactor, mouseMotion[1]*scaleFactor, 0) );
  }
  // left-mouse
  else if ( this.mouseButton[0] )
  {
    // rotate around the target
    var scaleFactor = -.005;
    this.rotateAroundTarget(mouseMotion[0]*scaleFactor, mouseMotion[1]*scaleFactor);
  }
  else
    return;
  // mark these controls as dirty
  self.dirty = true;
}

THREE.NormalControls.prototype.getRoll = function() {
  var rotation = new THREE.Matrix4();
  var offset = this.target.clone().sub(this.camera.position);
  rotation.makeRotationZ( -Math.atan2( offset.y, offset.x ) );
  var cameraForwards = offset.clone();
  cameraForwards.applyMatrix4( rotation );
  var cameraUp = this.camera.up.clone();
  cameraUp.applyMatrix4( rotation );
  rotation.makeRotationY( Math.atan2( cameraForwards.z, cameraForwards.x ) );
  cameraUp.applyMatrix4( rotation );
  return Math.atan2( cameraUp.z, cameraUp.y )-Math.PI/2;
}

THREE.NormalControls.prototype.translate = function( translationVector ) {
  var offset = this.target.clone();
  offset.sub( this.camera.position );
  var translate = new THREE.Vector3();
  var translateX = new THREE.Vector3( 0, translationVector.x, 0 );
  var translateY = new THREE.Vector3( 0, 0, translationVector.y );
  var translateZ = new THREE.Vector3( 0, 0, 0 );
  var rotation = new THREE.Matrix4();

  if ( translationVector.x )
  {
    rotation.makeRotationZ( Math.atan2( offset.y, offset.x ) );
    translateX.applyMatrix4( rotation );
  }
  if ( translationVector.y )
  {
    translateY = offset.clone().cross({x:0,y:0,z:1}).cross(offset); // use zaxis for up, as we roll compensate later
    translateY.normalize().multiplyScalar( translationVector.y );
  }
  if ( translationVector.z )
  {
    translateZ.sub( this.target, this.camera.position );
    translateZ.normalize().multiplyScalar( translationVector.z );
  }
  translate = translateX.clone().add( translateY ).add( translateZ );
  // rotate for roll
  rotation.makeRotationAxis( this.target.clone().sub(this.camera.position).normalize(), this.getRoll() );
  translate.applyMatrix4( rotation );
  this.camera.position.add( translate );
  this.target.add( translate );
}

THREE.NormalControls.prototype.zoom = function( factor ) {
  // this works because the zoom factor is implicitly multiplied by the camera distance
  this.camera.position.add( this.target.clone().sub(this.camera.position).multiplyScalar( factor ) )
  // check zoom bounds
  var distance = this.target.clone().sub(this.camera.position).length();
  if ( distance<this.minDistance )
  {
    this.camera.position.sub(this.target);
    this.camera.position.multiplyScalar(this.minDistance/distance);
    this.camera.position.add(this.target);
  }
  else if ( distance>this.maxDistance )
  {
    this.camera.position.sub(this.target);
    this.camera.position.multiplyScalar(this.maxDistance/distance);
    this.camera.position.add(this.target);
  }
}

THREE.NormalControls.prototype.rotateAroundTarget = function( azimuth, elevation ) {
    var rotationX = new THREE.Matrix4();
    var rotationY = new THREE.Matrix4();
    var rotation = new THREE.Matrix4();
    var axis = this.camera.up.clone();
    // rotate in target coords
    this.camera.position.sub( this.target );
    rotationX.makeRotationAxis( axis.cross( this.camera.position ).normalize(), elevation );
    if ( this.n00bMode )
      rotationY.makeRotationAxis( new THREE.Vector3(0, 0, this.camera.up.z).normalize(), azimuth );
    else
      rotationY.makeRotationAxis( this.camera.position.clone().cross(axis).normalize(), azimuth );
    rotation.multiplyMatrices(rotationY, rotationX);
    this.camera.position.applyMatrix4( rotation );
    this.camera.up.applyMatrix4( rotation );
    // go back to world coords
    this.camera.position.add( this.target );
}
