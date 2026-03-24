<?php
require_once('../leo-cfg.php');
$dataFolderPath = __DIR__ . $dataFolderPath;
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); //METHOD_NOT_ALLOWED
    echo json_encode(['success' => false, 'msg' => 'Method not allowed']);
    exit;
}

if (!isset($_GET['file'])) {
    http_response_code(400); //BAD_REQUEST
    echo json_encode(['success' => false, 'msg' => 'Invalid Request']);
    exit;
}

$target = $_GET['file'];
$dataPath =  $dataFolderPath . $target . $filePrefixAfter;
$data = file_get_contents('php://input');
file_put_contents($dataPath, $data);
http_response_code(200);
echo json_encode(['success' => true, 'msg' => 'Update successfully.']);
