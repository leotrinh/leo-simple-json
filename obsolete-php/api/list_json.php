<?php
require_once('../leo-cfg.php');
$file_list_rule = '.'.$dataFolderPath.'*'.$filePrefixAfter;
$files = glob($file_list_rule);
header('Content-Type: application/json');
foreach ($files as $file) {
    $fileName = pathinfo($file, PATHINFO_FILENAME); // Extracts the file name without extension
    $fileNames[] = $fileName;
}
http_response_code(200);
echo json_encode($fileNames);
