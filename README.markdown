Thingiview.js
=============

A javascript (using Canvas and WebGL if available) 3D model viewer.  Uses the [Three.js](http://github.com/mrdoob/three.js) 3D Engine.  Check out the [Examples](http://replimat.com/thingiview/examples/).

# Features

* supports binary and ascii STL and OBJ files without requiring any preprocessing, all the parsing is done on the client in javascript
* everything is done client side in javascript, requires no plugins for most browsers
* should work in all browsers, including iPhone/iPad (might require [Google Chrome Frame](http://code.google.com/chrome/chromeframe) for IE)
* uses HTML canvas or automatically detects and enables webgl if browser supports it
* configurable colors
* is made of awesome

# Example

<pre><code>
    &lt;script src="/javascripts/Three.js"&gt;&lt;/script&gt;
    &lt;script src="/javascripts/plane.js"&gt;&lt;/script&gt;
    &lt;script src="/javascripts/thingiview.js"&gt;&lt;/script&gt;

    &lt;script>
      window.onload = function() {
        thingiurlbase = "/javascripts";
        thingiview = new Thingiview("viewer");
        thingiview.setObjectColor('#C0D8F0');
        thingiview.initScene();
        thingiview.loadSTL("/objects/cube.stl");
      }
    &lt;/script&gt;

    &lt;div id="viewer" style="width:300px;height:300px"&gt;&lt;/div&gt;
</code></pre>

# Usage

It's important that everything is done within window.onload.

## thingiurlbase = "/javascripts";

Must be set to the path where the javascript files are located so that related scripts can be loaded dynamically.

## thingiview = new Thingiview("id of viewer's container div");

Pass the id of the div to place the viewer into.  You can set the width and height on the css for that div.

## thingiview.initScene();

Loads the scene into the container div.

## thingiview.loadSTL("/path/to/model.stl"); or thingiview.loadOBJ("/path/to/model.obj");

Make sure you pass the fill path to the model file you want to load.  This will make an ajax call to the server to fetch it.
  
## thingiview.setShowPlane(true);

`true or false`.  Show or hide the 100x100 grid plane under the object.
  
## thingiview.setBackgroundColor('#ffffff');

Sets the background color of the viewer's container.
  
## thingiview.setObjectMaterial('solid');

`solid or wireframe`.  Changes the object's material.
  
## thingiview.setObjectColor('#C0D8F0');
  
Yep, it sets the object's color.
  
## thingiview.setRotation(true);

`true or false`.  This causes the objet to slowly rotate around the z axis.
  
## thingiview.setCameraView('top');

Possible values include: `top, side, bottom, diagonal`.  Resets the camera view to the desired angle.
  
## thingiview.setCameraZoom(5);

Pass a positive number to zoom the camera in or a negative number to zoom out.

## thingiview.displayAlert("This is a message");

Displays the text passed in a window inside the viewer with an Ok button to then hide it.
