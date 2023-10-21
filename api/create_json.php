<?php
require_once('../leo-cfg.php');
$dataFolderPath = __DIR__ . $dataFolderPath;
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $fileName = $_GET['file'];
    $newFile = $dataFolderPath . $filePrefixBefore . $fileName . $filePrefixAfter;
    file_put_contents($newFile, json_encode([]));
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'msg' => 'Method not allowed']);
}
