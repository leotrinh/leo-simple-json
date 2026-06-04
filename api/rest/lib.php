<?php
/**
 * Shared bootstrap, auth and helpers for the REST API.
 *
 * Auth: clients must send the API key in the `j-api-key` request header.
 * The expected key is read from REST_API_KEY in the project .env file.
 */

// Load env + shared config from the project root (defines $filePrefixAfter etc.)
require_once(__DIR__ . '/../../leo-cfg.php');
require_once(__DIR__ . '/key-store.php');

// JSON bins live in api/db relative to this file (api/rest/ -> api/db/)
$REST_DATA_DIR = __DIR__ . '/../db/';

// Optional master key from .env: full access, never expires. Empty = disabled.
// API keys are normally managed via the UI (stored in storage/api-keys.json).
$REST_API_KEY = isset($_ENV['REST_API_KEY']) ? $_ENV['REST_API_KEY'] : '';

// Auth context for the current request, populated by rest_require_auth():
//   ['allowed_files' => array|null]  (null = every bin allowed)
$REST_AUTH_CTX = null;

/**
 * Send a JSON response and stop execution.
 */
function rest_respond($status, $payload)
{
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($payload);
    exit;
}

/**
 * Read the j-api-key header in a server-agnostic, case-insensitive way.
 */
function rest_read_api_key()
{
    if (!empty($_SERVER['HTTP_J_API_KEY'])) {
        return $_SERVER['HTTP_J_API_KEY'];
    }
    if (function_exists('getallheaders')) {
        foreach (getallheaders() as $name => $value) {
            if (strtolower($name) === 'j-api-key') {
                return $value;
            }
        }
    }
    return '';
}

/**
 * Abort with 401 unless a valid j-api-key header is present.
 *
 * Resolution order:
 *   1. .env master key (REST_API_KEY) -> full access, never expires.
 *   2. A managed key from the store -> must be enabled and not expired.
 * Populates $REST_AUTH_CTX with the allowed-files scope for this request.
 */
function rest_require_auth()
{
    global $REST_API_KEY, $REST_AUTH_CTX;

    $provided = (string) rest_read_api_key();
    if ($provided === '') {
        rest_respond(401, [
            'success' => false,
            'msg' => 'Unauthorized: missing j-api-key header',
        ]);
    }

    // 1) .env master key (optional bootstrap key with full access).
    if ($REST_API_KEY !== '' && hash_equals($REST_API_KEY, $provided)) {
        $REST_AUTH_CTX = ['allowed_files' => null];
        return;
    }

    // 2) Managed key from the store.
    $rec = ks_find_by_secret($provided);
    if ($rec === null) {
        rest_respond(401, [
            'success' => false,
            'msg' => 'Unauthorized: invalid j-api-key',
        ]);
    }
    if (!ks_is_active($rec)) {
        rest_respond(401, [
            'success' => false,
            'msg' => 'Unauthorized: key is disabled or expired',
        ]);
    }

    $allowed = isset($rec['allowed_files']) ? $rec['allowed_files'] : [];
    $REST_AUTH_CTX = [
        'allowed_files' => (is_array($allowed) && count($allowed) > 0) ? array_values($allowed) : null,
    ];
}

/**
 * Abort with 403 if the current key is not allowed to touch this bin.
 */
function rest_require_access($name)
{
    global $REST_AUTH_CTX;
    $allowed = $REST_AUTH_CTX['allowed_files'] ?? null;
    if ($allowed === null) {
        return; // full access
    }
    if (!in_array($name, $allowed, true)) {
        rest_respond(403, [
            'success' => false,
            'msg' => "Forbidden: this key cannot access bin '$name'",
        ]);
    }
}

/**
 * Validate + normalise a bin name. Prevents path traversal.
 * Allowed: letters, digits, underscore, dash, dot (no slashes, no leading dot).
 */
function rest_sanitize_name($name)
{
    $name = (string) $name;
    if ($name === '' || !preg_match('/^[A-Za-z0-9_][A-Za-z0-9_.\-]*$/', $name)) {
        rest_respond(400, [
            'success' => false,
            'msg' => 'Invalid bin name. Allowed: letters, digits, "_", "-", "."',
        ]);
    }
    return $name;
}

/**
 * Absolute filesystem path for a bin name.
 */
function rest_path_for($name)
{
    global $REST_DATA_DIR, $filePrefixAfter;
    return $REST_DATA_DIR . $name . $filePrefixAfter;
}

/**
 * Resolve the bin name from PATH_INFO (/api/rest/index.php/<name>)
 * or the `name` query param. Returns '' when listing the collection.
 */
function rest_resource_name()
{
    if (!empty($_SERVER['PATH_INFO'])) {
        return trim($_SERVER['PATH_INFO'], '/');
    }
    if (isset($_GET['name'])) {
        return $_GET['name'];
    }
    return '';
}

/**
 * Read raw request body and ensure it is valid JSON.
 * Empty body is treated as an empty JSON object "{}".
 */
function rest_read_json_body()
{
    $raw = file_get_contents('php://input');
    if (trim($raw) === '') {
        return '{}';
    }
    json_decode($raw);
    if (json_last_error() !== JSON_ERROR_NONE) {
        rest_respond(422, [
            'success' => false,
            'msg' => 'Request body is not valid JSON: ' . json_last_error_msg(),
        ]);
    }
    return $raw;
}
