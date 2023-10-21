<?php
if (is_readable(__DIR__ . '/vendor/autoload.php')) {
    /** @noinspection PhpIncludeInspection */
    require_once __DIR__ . '/vendor/autoload.php';
}
$envFilePath = __DIR__ . '/.env';
if (file_exists($envFilePath)) {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->load();
} else {
    echo "Missing .env file. Please create .env file then copy from .env.sample";
    exit;
}

// Get the values from the environment
$authUser = $_ENV['AUTH_UID'];
$authPwd = $_ENV['AUTH_PWD'];
$appVersion = $_ENV['APP_VERSION'];
$appTitle = $_ENV['APP_TITLE'];
$appLogoPath = $_ENV['LOGO_PATH'];
$dataFolderPath = '/db/';
$filePrefixBefore = $_ENV['FILE_PREFIX_BEFORE'];
$filePrefixAfter = $_ENV['FILE_PREFIX_AFTER'];

function isMobileOrTablet()
{
    $userAgent = $_SERVER['HTTP_USER_AGENT'];
    return preg_match('/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i', $userAgent);
}
