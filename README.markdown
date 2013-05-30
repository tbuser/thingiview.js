Thingiview.js
=============

A javascript (using Canvas and WebGL if available) 3D model viewer.  Uses the [Three.js](http://github.com/mrdoob/three.js) 3D Engine.

# Features

* does all the standard Three.js things
* is made of awesome

# Example

<pre><code>
		&lt;script src="js/three.min.js">&lt;/script>
		&lt;script src="js/Thingiview.js">&lt;/script>
    &lt;script src="js/NormalControls.js">&lt;/script>

    &lt;script>
      var filename = "/some/3d/model.js"; // URL of a Three.js model
      var thingiview = new Thingiview();

      loader = new THREE.JSONLoader(false);
      loadCallback = function ( geometry, materials ) {
        thingiview.addModel( geometry );
      };
      loader.load(filename, loadCallback);

      var animate = function() {
        requestAnimationFrame( animate );
        thingiview.render();
      }
      animate();
    &lt;/script&gt;
</code></pre>

models can be converted to the Three.js JSON format via [mersh](https://github.com/tbuser/mersh) or any of the other exporters included in the three.js project
