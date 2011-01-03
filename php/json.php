<?php

// might need to be higher if server chokes on really really big models...
set_time_limit(120);

include('convert.php');

$file = $_GET['file'];

// TODO: check for ascii/binary stl or obj file...
$result = parse_stl_string($file);

echo json_encode($result);

?>