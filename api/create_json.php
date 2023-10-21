<?php
require_once('../leo-cfg.php');
$dataFolderPath = __DIR__ . $dataFolderPath;
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); //METHOD_NOT_ALLOWED
    echo json_encode(['success' => false, 'msg' => 'Method not allowed']);
    exit;
}

$fileName = $_GET['file'];
$newFile = $dataFolderPath . $filePrefixBefore . $fileName . $filePrefixAfter;
file_put_contents($newFile, json_encode([]));
http_response_code(200);
echo json_encode(['success' => true]);
