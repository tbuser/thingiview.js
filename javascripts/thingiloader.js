// importScripts('Three.js');
importScripts('binaryReader.js');

onmessage = function (event) {
  switch(event.data.cmd) {
    case "loadSTL":
    loadSTL(event.data.param);
    break;
    case "loadSTLString":
    loadSTLString(event.data.param);
    break;
    case "loadSTLBinary":
    loadSTLBinary(event.data.param);
    break;
    case "loadOBJ":
    loadOBJ(event.data.param);
    break;
    case "loadOBJString":
    loadOBJString(event.data.param);
    break;
  }
};

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

function loadSTL(url) {
  postMessage({'status':'progress', 'content':'Downloading ' + url});  
  var file = load_binary_resource(url);
  var reader = new BinaryReader(file);
  if (reader.readString(5) == "solid") {
    loadSTLString(file);
  } else {
    loadSTLBinary(reader);
  }
}

function loadOBJ(url) {
  postMessage({'status':'progress', 'content':'Downloading ' + url});  
  var file = load_binary_resource(url);
  loadOBJString(file);
}

function loadSTLString(STLString) {
  postMessage({'status':'progress', 'content':'Parsing STL String...'});  
  postMessage({'status':'complete', 'content':ParseSTLString(STLString)});
}

function loadSTLBinary(STLBinary) {
  postMessage({'status':'progress', 'content':'Parsing STL Binary...'});
  postMessage({'status':'complete', 'content':ParseSTLBinary(STLBinary)});
}

function loadOBJString(OBJString) {
  postMessage({'status':'progress', 'content':'Parsing OBJ String...'});
  postMessage({'status':'complete', 'content':ParseOBJString(OBJString)});
}

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
  // console.log("header = '" + header + "'");
  
  // count = STLBinary.getShortAt(80);
  // STLBinary.seek(80);
  count = STLBinary.readUInt32();
  // console.log("number of triangles = " + count);
  // count = 10000;

  percent = 0;
  last_percent = 0;

  for (var i = 0; i < count; i++) {
    percent = parseInt(i / count * 100);

    if (percent % 5 == 0 && percent != last_percent) {
      postMessage({'status':'progress', 'content':percent + '%'});
      last_percent = percent;
    }

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

  // console.log("size = " + STLBinary.getSize());
  // console.log("position = " + STLBinary.getPosition());
  
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

function ParseOBJString(OBJString) {
  var vertexes  = [];
  var normals   = [];
  var faces     = [];

  var lines = OBJString.split("\n");
  
  var normal_position = 0;
  
  for (var i=0; i<lines.length; i++) {
    line_parts = lines[i].replace(/\s+/g, " ").split(" ");
    
    if (line_parts[0] == "v") {
      var vertex = [parseFloat(line_parts[1]), parseFloat(line_parts[2]), parseFloat(line_parts[3])];
      vertexes.push(vertex);
      // console.log("vertex: " + vertex);
    } else if (line_parts[0] == "vn") {
      if (normal_position == 0) {
        var normal = [parseFloat(line_parts[1]), parseFloat(line_parts[2]), parseFloat(line_parts[3])];
        normals.push(normal);
        // console.log("normal: " + normal);
      }
      normal_position++;
      if (normal_position > 2) {
        normal_position = 0;
      }
    } else if (line_parts[0] == "f") {
      var face = [parseFloat(line_parts[1].split("/")[0])-1, parseFloat(line_parts[2].split("/")[0])-1, parseFloat(line_parts[3].split("/")[0]-1), 0];
      faces.push(face)
      // console.log("face: " + face);
    }
  }
  
  return [vertexes, normals, faces];
}
