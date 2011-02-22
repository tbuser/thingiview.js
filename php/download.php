<?php
// Download an STL file from another website and convert it to thingiview formatted json

// server needs a good cpu!  Might need to make timeout higher if server chokes on really really big models...
set_time_limit(3000);

include('convert.php');

function url_to_filename($url) {
  $filename = $url;
  
  $filename = str_replace('http://','',$filename);
  $filename = str_replace('/','_',$filename);
  $filename = str_replace('\\','',$filename);
  $filename = str_replace('.','_',$filename);
  $filename = str_replace(':','-',$filename);
  
  return $filename;
}

$url = $_GET['url'];

$cache_dir = "/tmp";
$stl_filename = url_to_filename($url);
$json_filename = "$stl_filename.json";

if (!file_exists("$cache_dir/$json_filename")) {
  $contents = file_get_contents($url);
  file_put_contents("$cache_dir/$stl_filename", $contents);
  $contents = preg_replace('/$\s+.*/', '', $contents);

  if (stripos($contents, 'solid') === FALSE) {
    $handle = fopen("$cache_dir/$stl_filename", 'rb');
    if (!$handle) {
      trigger_error("Failed to open file $cache_dir/$stl_filename");
    }
    $result = parse_stl_binary($handle);
  } else {
    $result = parse_stl_string($contents);
  }
  
  file_put_contents("$cache_dir/$json_filename", json_encode($result));
  unlink("$cache_dir/$stl_filename");
}

$result = file_get_contents("/tmp/$json_filename");
echo $result;

?>