<?php

// server needs a good cpu!  Might need to make timeout higher if server chokes on really really big models...
set_time_limit(300);

include('convert.php');

$file = $_GET['file'];

$file_parts = pathinfo($file);
switch($file_parts['extension']){
  case 'stl':
    $contents = file_get_contents($file);    
    $contents = preg_replace('/$\s+.*/', '', $contents);
    if (stripos($contents, 'solid') === FALSE) {
      $result = parse_stl_binary($file);
    } else {
      $result = parse_stl_string($file);
    }  
    break;
  case 'obj':
    $result = parse_obj_string($file);
    break;
}

echo json_encode($result);

?>