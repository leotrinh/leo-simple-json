<?php
require_once('../leo-cfg.php');
$dataFolderPath = __DIR__ . $dataFolderPath;

header('Content-Type: application/json');
if (isset($_GET['target'])) {
    $target = $_GET['target'];
    $dataPath =  $dataFolderPath . $target . $filePrefixAfter;

    if (is_readable($dataPath)) {
        $data = file_get_contents($dataPath);
        if (empty($data)) {
            echo "{}";
            exit;
        }
        echo $data;
        exit;
    }
    echo json_encode(['success' => false, 'msg' => 'Invalid Target']);
    exit;
}

echo json_encode(['success' => false, 'msg' => 'Invalid Request']);
