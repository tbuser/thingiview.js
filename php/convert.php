<?php

function parse_stl_string($filename) {
  $lines    = file($filename);
  
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
        
        // if (!$face_vertexes[$normal_count]) {
        //   $face_vertexes[$normal_count] = array();
        // }
        
        $face_vertexes[$normal_count][] = $vertex;
      }
    }
  }

  // build faces
  foreach($face_vertexes as $index => $face_vertex) {
    $faces[$index] = array(array_search($face_vertex[0], $vertexes), array_search($face_vertex[1], $vertexes), array_search($face_vertex[2], $vertexes));
  }
  
  // TODO: normals aren't really needed... should probably skip parsing them too
  return array($vertexes, array(), $faces);
}

?>