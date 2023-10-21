<?php
require_once('../leo-cfg.php');
$dataFolderPath = __DIR__ . $dataFolderPath;
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Content-Type: application/json');
    if (isset($_GET['target'])) {
        $target = $_GET['target'];
        $dataPath =  $dataFolderPath . $target . $filePrefixAfter;

        if (is_readable($dataPath)) {
            $data = file_get_contents($dataPath);
            if (empty($data)) {
                echo "{}";
                return;
            }
            echo $data;
        } else {
            echo json_encode(['success' => false, 'msg' => 'Invalid Target']);
        }
    }
    if (!isset($_GET['target'])) {
        echo json_encode(['success' => false, 'msg' => 'Invalid Request']);
    }
}
