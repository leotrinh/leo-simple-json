<?php
require_once('../leo-cfg.php');
$dataFolderPath = __DIR__ . $dataFolderPath;
header('Content-Type: application/json');

if (!isset($_GET['target'])) {
    http_response_code(400); //BAD_REQUEST
    echo json_encode(['success' => false, 'msg' => 'Invalid Request']);
    exit;
}

$target = $_GET['target'];
$dataPath =  $dataFolderPath . $target . $filePrefixAfter;
if (!is_readable($dataPath)) {
    http_response_code(400); //NOT_FOUND
    echo json_encode(['success' => false, 'msg' => $target . ' is not exist']);
    exit;
}
$jsonData = file_get_contents($dataPath);

//return empty JSON object in that case
if (empty($jsonData)) {
    echo "{}";
    exit;
}
echo $jsonData;
exit;
