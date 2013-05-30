var Thingiview = function() {
  this.width = window.innerWidth;
  this.height = window.innerHeight;
  this.models = [];
  this.fogColor = 0xffffff;
  this.scale = 1;

  this.init();
}

Thingiview.prototype.init = function() {
  // set up DOM
  this.container = document.createElement( 'div' );
  this.container.style.width = this.width+"px";
  this.container.style.height = this.height+"px";
  this.container.style.backgroundColor = "#"+this.fogColor.toString(16);
  document.body.appendChild( this.container );

  this.scene = new THREE.Scene();

  this.camera = new THREE.PerspectiveCamera( 60, this.width / this.height, 1, 100000 );
  this.camera.position.z = 300;
  this.camera.position.y = -500;
  this.camera.position.x = -500;
  this.camera.up = new THREE.Vector3(0, 0, 1);
  this.controls = new THREE.NormalControls(this.camera, this.container);

  this.reflectCamera = new THREE.CubeCamera( 0.1, 5000, 512 );
  this.scene.add( this.reflectCamera );

  // Skybox
  var material = new THREE.MeshPhongMaterial({color:0xffffff,emissive: 0xffffff, shading: THREE.SmoothShading, fog: false, side: THREE.BackSide});
  var skybox = new THREE.Mesh( new THREE.CubeGeometry( 1000, 1000, 1000 ), material );
  skybox.name = 'skybox';
  this.scene.add( skybox );

  // Ground Plane
  var groundPlaneMaterial = new THREE.MeshPhongMaterial({color: 0x888888, wireframe: false, envMap: this.reflectCamera.renderTarget});
  var x = 1000;
  var y = 1000;
  var division_x = Math.floor(x / 10);
  var division_y = Math.floor(y / 10);
  this.plane = new THREE.Mesh(new THREE.PlaneGeometry(x, y, division_x, division_y), groundPlaneMaterial);
  this.plane.name = 'plane';
  this.plane.receiveShadow = true;
  this.scene.add(this.plane);

  this.scene.fog = new THREE.FogExp2(this.fogColor, 0.007);

  this.renderer = new THREE.WebGLRenderer();
  this.renderer.setSize( this.width, this.height );
  //this.renderer.autoClear = false;
  this.container.appendChild( this.renderer.domElement );

  this.initLights();
}

Thingiview.prototype.resize = function( width, height )
{
  this.width = width;
  this.height = height;
  this.camera.aspect = width/height;
  this.camera.updateProjectionMatrix();
  this.renderer.setSize( width, height );
}

Thingiview.prototype.initLights = function()
{
  this.spotLight = new THREE.SpotLight(0xffffff, .3, 0);
  this.spotLight.position.set(-700, 1000, 1000);
  this.spotLight.castShadow = true;
  this.scene.add(this.spotLight);

  this.pointLights = [];

  pointLight = new THREE.PointLight(0xffa0a0, 0.7, 0);
  pointLight.position.set(3000, -3000, 3000);
  this.scene.add(pointLight);
  this.pointLights.push(pointLight);

  pointLight = new THREE.PointLight(0xffffff, 0.6, 0);
  pointLight.position.set(1000, 1000, 0);
  this.scene.add(pointLight);
  this.pointLights.push(pointLight);

}

Thingiview.prototype.centerCamera = function() {
  var sceneCenter = undefined;
  var sceneObjects = 0;
  var sceneBox = new THREE.Box3();
  this.scene.traverse( function (object) {
    if (object instanceof THREE.Mesh)
    {
      if ( object.name=="skybox" || object.name=="plane" || object.name=="planewire" )
        return;
      sceneObjects += 1;

      // center based on the objects' bounding boxes
      object.geometry.computeBoundingBox();
      // convert to world coords
      object.geometry.boundingBox.min.applyMatrix4(object.matrixWorld);
      object.geometry.boundingBox.max.applyMatrix4(object.matrixWorld);
      // matrixWorld is not what it says that it is?  Anyways, it was missing these transforms
      object.geometry.boundingBox.min.x += object.position.x;
      object.geometry.boundingBox.min.y += object.position.y;
      object.geometry.boundingBox.min.z += object.position.z;
      object.geometry.boundingBox.max.x += object.position.x;
      object.geometry.boundingBox.max.y += object.position.y;
      object.geometry.boundingBox.max.z += object.position.z;

      var objectCenter = object.geometry.boundingBox.center();
      objectCenter.z /= 2;

      // update scene bounding box
      sceneBox.min.x = Math.min(sceneBox.min.x, object.geometry.boundingBox.min.x);
      sceneBox.min.y = Math.min(sceneBox.min.y, object.geometry.boundingBox.min.y);
      sceneBox.min.z = Math.min(sceneBox.min.z, object.geometry.boundingBox.min.z);
      sceneBox.max.x = Math.max(sceneBox.max.x, object.geometry.boundingBox.max.x);
      sceneBox.max.y = Math.max(sceneBox.max.y, object.geometry.boundingBox.max.y);
      sceneBox.max.z = Math.max(sceneBox.max.z, object.geometry.boundingBox.max.z);
      // New center in world space
      if ( sceneCenter===undefined )
        newCenter = objectCenter.clone();
      else
      {
        var newCenter = new THREE.Vector3();
        newCenter.sub(objectCenter, sceneCenter);
        newCenter.divideScalar(sceneObjects+1);
        newCenter.add(sceneCenter);
      }
      sceneCenter = newCenter;
    }
  } );
  this.controls.desiredCameraTarget = sceneCenter;
  // TODO the scale and translate terms don't play well together, hacking it due to other people's votes
  this.controls.desiredCameraTarget.x = this.controls.desiredCameraTarget.y = 0;
  // calculate desired camera zoom based on vertical fov
  var distanceX = (sceneBox.max.x-sceneBox.min.x)/2/Math.tan(this.controls.camera.fov*this.controls.camera.aspect*Math.PI/360);
  var distanceY = (sceneBox.max.y-sceneBox.min.y)/2/Math.tan(this.controls.camera.fov*this.controls.camera.aspect*Math.PI/360);
  var distanceZ = (sceneBox.max.z-sceneBox.min.z)/2/Math.tan(this.controls.camera.fov*Math.PI/360);
  var distance = Math.max( Math.max(distanceX, distanceY), distanceZ );
  // scale outwards a factor
  distance *= 1.9*this.scale;
  var cameraPosition = this.controls.target.clone().sub(this.camera.position).normalize().multiplyScalar(distance);
  this.controls.desiredCameraPosition = sceneCenter.clone().sub(cameraPosition);
  // constrain max zoom to some factor of our default
  this.controls.maxDistance = distance*10;
}

Thingiview.prototype.addModel = function(geometry) {

  var obj, i;
  material = new THREE.MeshPhongMaterial({color:0xa01010, specular: 0xA0A0A0, shading: THREE.SmoothShading, shininess: 150, fog: false, side: THREE.DoubleSide});

  var mesh = new THREE.Mesh( geometry, material );
  // rotate object
  var rotation = new THREE.Matrix4();
  rotation.makeRotationAxis( new THREE.Vector3(1, 0, 0), Math.PI/2 );
  mesh.geometry.applyMatrix( rotation );
  // get dims
  mesh.geometry.computeBoundingBox();
  var dims = mesh.geometry.boundingBox.max.clone().sub(mesh.geometry.boundingBox.min);
  maxDim = Math.max(Math.max(dims.x, dims.y), dims.z); 
  this.scale = 100/maxDim;
  // center object
  mesh.position.x = -(mesh.geometry.boundingBox.min.x+mesh.geometry.boundingBox.max.x)/2*this.scale;
  mesh.position.y = -(mesh.geometry.boundingBox.min.y+mesh.geometry.boundingBox.max.y)/2*this.scale;
  mesh.position.z = -mesh.geometry.boundingBox.min.z*this.scale;

  this.scene.add( mesh );
  this.models.push( mesh );

  // scale everything to this new object
  for ( var i=0; i<this.models.length; i++ )
    this.models[i].scale.x = this.models[i].scale.y = this.models[i].scale.z = this.scale;
  this.plane.scale.x = this.plane.scale.y = this.plane.scale.z = this.scale;

  this.centerCamera();
}

Thingiview.prototype.render = function() {
  // update clock
  var now = Date.now();
  if ( this.lastRenderTime==undefined )
    this.timeElapsed = 0;
  else
    this.timeElapsed = now-this.lastRenderTime;
  this.lastRenderTime = now;

  this.controls.dirty = false;
  this.controls.update( this.timeElapsed );

  this.reflectCamera.position.z = -this.camera.position.z;
  this.reflectCamera.position.y = this.camera.position.y;
  this.reflectCamera.position.x = this.camera.position.x;
  // turn off the plane visibility for reflection rendering
  this.scene.traverse( function (object) {
    if ( object.name=="plane" )
      object.visible = false;
    if ( object.name=="skybox" )
      object.visible = true;
  });
  // render the reflection texture
  this.reflectCamera.updateCubeMap( this.renderer, this.scene );

  // turn back on the plane visibility
  this.scene.traverse( function (object) {
    if ( object.name=="plane" )
      object.visible = true;
    if ( object.name=="skybox" )
      object.visible = false;
  });
  this.renderer.render( this.scene, this.camera );
}

