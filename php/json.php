<?php

// server needs a good cpu!  Might need to make timeout higher if server chokes on really really big models...
set_time_limit(3000);

include('convert.php');

$file = $_GET['file'];

$file_parts = pathinfo($file);

$handle = fopen($file, 'rb');

if ($handle == FALSE) {
  trigger_error("Failed to open file $file");
}

$contents = "";

while (!feof($handle)) {
  $contents .= fgets($handle);
}

$contents = preg_replace('/$\s+.*/', '', $contents);

switch($file_parts['extension']){
  case 'stl':
    if (stripos($contents, 'solid') === FALSE) {
      $result = parse_stl_binary($handle);
    } else {
      $result = parse_stl_string($contents);
    }  
    break;
  case 'obj':
    $result = parse_obj_string($contents);
    break;
}

echo json_encode($result);

?>