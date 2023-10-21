<?php
require_once('../leo-cfg.php');
$dataFolderPath = __DIR__ . $dataFolderPath;
header('Content-Type: application/json');
// Check if a file name is provided in the URL
if (isset($_GET['file'])) {
    $fileName = $_GET['file'];
    
    // Define the directory where JSON files are stored
    $filePath =  $dataFolderPath . $fileName . $filePrefixAfter;

    // Check if the file exists
    if (file_exists($filePath)) {
        // Attempt to delete the file
        if (unlink($filePath)) {
            // File deleted successfully
            http_response_code(200); // OK status
        } else {
            // Error deleting the file
            http_response_code(500); // Internal Server Error
            echo "Error deleting the file.";
        }
    } else {
        // File not found
        http_response_code(404); // Not Found
        echo "File not found.";
    }
} else {
    // File name not provided
    http_response_code(400); // Bad Request
    echo "File name not provided.";
}
