// onmessage = function (event) {
//   loader = new Thingiloader();
//   
//   switch(event.data.cmd) {
//     case "loadSTL":
//     loader.loadSTL(event.data.param);
//     break;
//     case "loadSTLString":
//     loader.loadSTLString(event.data.param);
//     break;
//     case "loadSTLBinary":
//     loader.loadSTLBinary(event.data.param);
//     break;
//     case "loadOBJ":
//     loader.loadOBJ(event.data.param);
//     break;
//     case "loadOBJString":
//     loader.loadOBJString(event.data.param);
//     break;
//   }
// };

Thingiloader = function(event) {
  // Code from https://developer.mozilla.org/En/Using_XMLHttpRequest#Receiving_binary_data
  this.load_binary_resource = function(url) {
  	var req = new XMLHttpRequest();
  	req.open('GET', url, false);
  	// The following line says we want to receive data as Binary and not as Unicode
  	req.overrideMimeType('text/plain; charset=x-user-defined');
  	req.send(null);
  	if (req.status != 200) return '';
  	return req.responseText;
  };

  this.loadSTL = function(url) {
    workerFacadeMessage({'status':'message', 'content':'Downloading ' + url});  
    var file = this.load_binary_resource(url);
    var reader = new BinaryReader(file);
    if (reader.readString(5) == "solid") {
      this.loadSTLString(file);
    } else {
      this.loadSTLBinary(reader);
    }
  };

  this.loadOBJ = function(url) {
    workerFacadeMessage({'status':'message', 'content':'Downloading ' + url});  
    var file = this.load_binary_resource(url);
    this.loadOBJString(file);
  };

  this.loadSTLString = function(STLString) {
    workerFacadeMessage({'status':'message', 'content':'Parsing STL String...'});  
    workerFacadeMessage({'status':'complete', 'content':this.ParseSTLString(STLString)});
  };

  this.loadSTLBinary = function(STLBinary) {
    workerFacadeMessage({'status':'message', 'content':'Parsing STL Binary...'});
    workerFacadeMessage({'status':'complete', 'content':this.ParseSTLBinary(STLBinary)});
  };

  this.loadOBJString = function(OBJString) {
    workerFacadeMessage({'status':'message', 'content':'Parsing OBJ String...'});
    workerFacadeMessage({'status':'complete', 'content':this.ParseOBJString(OBJString)});
  }

  this.ParseSTLBinary = function(STLBinary) {
    var vertexes  = [];
    var normals   = [];
    var faces     = [];
  
    var face_vertexes = [];

    STLBinary.seek(0);

    header = STLBinary.readString(80);
  
    count = STLBinary.readUInt32();

    for (var i = 0; i < count; i++) {
      workerFacadeMessage({'status':'message', 'content':'Parsing ' + (i+1) + ' of ' + count + ' polygons...'});
      workerFacadeMessage({'status':'progress', 'content':parseInt(i / count * 100) + '%'});
      
      // normals.push([STLBinary.readFloat(),STLBinary.readFloat(),STLBinary.readFloat()]);
      STLBinary.seek(STLBinary.getPosition() + ((32 >> 3) * 3));
    
      for (var x = 0; x < 3; x++) {
        vertex = [STLBinary.readFloat(),STLBinary.readFloat(),STLBinary.readFloat()];
      
        if (vertexes.myIndexOf(vertex) == -1) {
          vertexes.push(vertex);
        }

        if (face_vertexes[i] == undefined) {
          face_vertexes[i] = [];
        }
        face_vertexes[i].push(vertex);
      
      }
    
      attribute = STLBinary.readUInt16();
    }

    workerFacadeMessage({'status':'message', 'content':'Building faces...'});
    for (var i=0; i<face_vertexes.length; i++) {
      workerFacadeMessage({'status':'progress', 'content':parseInt(i / face_vertexes.length * 100) + '%'});
      faces[i] = [ vertexes.myIndexOf(face_vertexes[i][0]), vertexes.myIndexOf(face_vertexes[i][1]), vertexes.myIndexOf(face_vertexes[i][2]) ];
    }
  
    return [vertexes, normals, faces];
  };

  // build stl's vertex and face arrays
  this.ParseSTLString = function(STLString) {
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

    workerFacadeMessage({'status':'message', 'content':'Parsing vertexes...'});
    for (var i=0; i<points.length/12-1; i++) {
      workerFacadeMessage({'status':'progress', 'content':parseInt(i / (points.length/12-1) * 100) + '%'});
    
      // normal = [parseFloat(points[block_start]), parseFloat(points[block_start+1]), parseFloat(points[block_start+2])]
      // normals.push(normal)
    
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

    workerFacadeMessage({'status':'message', 'content':'Building faces...'});
    for (var i=0; i<face_vertexes.length; i++) {
      workerFacadeMessage({'status':'progress', 'content':parseInt(i / face_vertexes.length * 100) + '%'});
      faces[i] = [ vertexes.myIndexOf(face_vertexes[i][0]), vertexes.myIndexOf(face_vertexes[i][1]), vertexes.myIndexOf(face_vertexes[i][2]) ];
    }
  
    return [vertexes, normals, faces];
  };

  this.ParseOBJString = function(OBJString) {
    var vertexes  = [];
    var normals   = [];
    var faces     = [];

    var lines = OBJString.split("\n");
  
    // var normal_position = 0;
  
    for (var i=0; i<lines.length; i++) {
      workerFacadeMessage({'status':'progress', 'content':parseInt(i / lines.length * 100) + '%'});
    
      line_parts = lines[i].replace(/\s+/g, " ").split(" ");
    
      if (line_parts[0] == "v") {
        vertexes.push([parseFloat(line_parts[1]), parseFloat(line_parts[2]), parseFloat(line_parts[3])]);
      } else if (line_parts[0] == "vn") {
        // if (normal_position == 0) {
        //   var normal = [parseFloat(line_parts[1]), parseFloat(line_parts[2]), parseFloat(line_parts[3])];
        //   normals.push(normal);
        //   // console.log("normal: " + normal);
        // }
        // normal_position++;
        // if (normal_position > 2) {
        //   normal_position = 0;
        // }
      } else if (line_parts[0] == "f") {
        faces.push([parseFloat(line_parts[1].split("/")[0])-1, parseFloat(line_parts[2].split("/")[0])-1, parseFloat(line_parts[3].split("/")[0]-1), 0])
      }
    }
  
    return [vertexes, normals, faces];
  };

  switch(event.data.cmd) {
    case "loadSTL":
    this.loadSTL(event.data.param);
    break;
    case "loadSTLString":
    this.loadSTLString(event.data.param);
    break;
    case "loadSTLBinary":
    this.loadSTLBinary(event.data.param);
    break;
    case "loadOBJ":
    this.loadOBJ(event.data.param);
    break;
    case "loadOBJString":
    this.loadOBJString(event.data.param);
    break;
  }  

};

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

if(typeof(window) === "undefined"){
    onmessage = Thingiloader;
    workerFacadeMessage = postMessage;
    importScripts('binaryReader.js');
} else {
    workerFacadeMessage = WorkerFacade.add(thingiurlbase + "/thingiloader.js", Thingiloader);
}
