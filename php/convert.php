<?php

function parse_stl_string($str) {
  $lines = split("\n", $str);
  
  $vertexes = array();
  $normals  = array();
  $faces    = array();
  
  $face_vertexes = array();

  $normal_count = -1;

  foreach($lines as $line) {
    // TODO: maybe faster if you strip spaces on whole contents instead of every line
    $line = preg_replace('/\s+/', ' ', $line);
    $line = preg_replace('/\s+$/', '', $line);
    // echo $line . "<br/>\n";
    
    // TODO: probably don't need to parse normals anyway
    preg_match('/facet normal (.*) (.*) (.*)$/', $line, $matches);
    if (count($matches) > 1) {
      $normals[] = array((float)$matches[1], (float)$matches[2], (float)$matches[3]);
      $normal_count++;
    } else {
      preg_match('/vertex (.*) (.*) (.*)$/', $line, $matches);
      if (count($matches) > 1) {
        $vertex = array((float)$matches[1], (float)$matches[2], (float)$matches[3]);
        
        if (!in_array($vertex, $vertexes)) {
          $vertexes[] = $vertex;
        }
        
        $face_vertexes[$normal_count][] = $vertex;
      }
    }
  }

  $faces = make_faces($vertexes, $face_vertexes);
  
  // TODO: normals aren't really needed... should probably skip parsing them too
  return array($vertexes, array(), $faces);
}

function parse_stl_binary($fp) {
  $vertexes = array();
  $normals  = array();
  $faces    = array();

  $face_vertexes = array();

  // $fp = fopen($filename, "rb");
  rewind($fp);

  // skip header
  $data = fread($fp, 80);
  $header = unpack("c*", $data);

  // get number of faces
  $data = fread($fp, 4);
  $count = unpack("i", $data);

  for ($i = 0; $i < $count[1]; $i++) {
    // skip normals
    $data = fread($fp, 12);
    $normal = unpack("fff", $data);

    for ($v_count = 0; $v_count < 3; $v_count++) {
      $points = array();
      
      for ($v_index = 0; $v_index < 3; $v_index ++) {
        $data = fread($fp, 4);
        $points[] = unpack("f", $data);        
      }

      $vertex = array($points[0][1], $points[1][1], $points[2][1]);

      if (!in_array($vertex, $vertexes)) {
        $vertexes[] = $vertex;
      }
      
      $face_vertexes[$i][] = $vertex;

    }

    $data = fread($fp, 2);
    $attribute = unpack("S", $data);
  }
  
  $faces = make_faces($vertexes, $face_vertexes);
  
  return array($vertexes, array(), $faces);
}

function parse_obj_string($str) {
  $lines    = split("\n", $str);

  $vertexes = array();
  $normals  = array();
  $faces    = array();

  foreach($lines as $line) {
    $line = preg_replace('/\s+/', ' ', $line);
    
    $parts = explode(' ', $line);
    
    switch ($parts[0]) {
      case 'v':
        $vertexes[] = array((float)$parts[1], (float)$parts[2], (float)$parts[3]);
        break;
      case 'f':
        $face_point1_parts = explode('/', $parts[1]);
        $face_point2_parts = explode('/', $parts[2]);
        $face_point3_parts = explode('/', $parts[3]);

        $faces[] = array((float)$face_point1_parts[0]-1, (float)$face_point2_parts[0]-1, (float)$face_point3_parts[0]-1);
        break;
    }
  }
  
  return array($vertexes, array(), $faces);
}

function make_faces($vertexes, $face_vertexes) {
  $faces = array();
  
  foreach($face_vertexes as $index => $face_vertex) {
    $faces[$index] = array(array_search($face_vertex[0], $vertexes), array_search($face_vertex[1], $vertexes), array_search($face_vertex[2], $vertexes));
  }
  
  return $faces;
}

?>