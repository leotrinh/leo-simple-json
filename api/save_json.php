<?php
require_once('../leo-cfg.php');
$dataFolderPath = __DIR__ . $dataFolderPath;
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $target = $_GET['file'];
    $dataPath =  $dataFolderPath . $target . $filePrefixAfter;
    $data = file_get_contents('php://input');
    file_put_contents($dataPath, $data);
    echo json_encode(['success' => true, 'msg' => 'Update successfully.']);
} else {
    echo json_encode(['success' => false, 'msg' => 'Method not allowed']);
}
