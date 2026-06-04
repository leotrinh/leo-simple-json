<?php
/**
 * REST API for the simple JSON store (CRUD).
 *
 * Auth:    send header  j-api-key: <REST_API_KEY from .env>
 * Base:    /leo-simple-json/api/rest/
 *
 * Endpoints (bin name via ?name=<bin> or path /index.php/<bin>):
 *   GET    /                 -> list all bin names
 *   GET    /?name=foo        -> read bin "foo"
 *   POST   /?name=foo        -> create bin "foo" (body = JSON, optional)
 *   PUT    /?name=foo        -> replace bin "foo" content (body = JSON)
 *   DELETE /?name=foo        -> delete bin "foo"
 */

require_once(__DIR__ . '/lib.php');

// --- CORS (public API): allow the custom auth header + preflight ----------
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, j-api-key');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// --- Every request must be authenticated ----------------------------------
rest_require_auth();

$method = $_SERVER['REQUEST_METHOD'];
$name = rest_resource_name();

switch ($method) {
    case 'GET':
        ($name === '') ? rest_list() : rest_read(rest_sanitize_name($name));
        break;

    case 'POST':
        rest_create(rest_sanitize_name($name));
        break;

    case 'PUT':
        rest_update(rest_sanitize_name($name));
        break;

    case 'DELETE':
        rest_delete(rest_sanitize_name($name));
        break;

    default:
        rest_respond(405, ['success' => false, 'msg' => 'Method not allowed']);
}

// --------------------------------------------------------------------------
// Handlers
// --------------------------------------------------------------------------

/** List every bin name (without the file extension), scoped to the key. */
function rest_list()
{
    global $REST_DATA_DIR, $filePrefixAfter, $REST_AUTH_CTX;
    $allowed = $REST_AUTH_CTX['allowed_files'] ?? null;

    $names = [];
    foreach (glob($REST_DATA_DIR . '*' . $filePrefixAfter) as $file) {
        $name = pathinfo($file, PATHINFO_FILENAME);
        if ($allowed === null || in_array($name, $allowed, true)) {
            $names[] = $name;
        }
    }
    rest_respond(200, ['success' => true, 'data' => $names]);
}

/** Return the raw JSON content of a bin. */
function rest_read($name)
{
    rest_require_access($name);
    $path = rest_path_for($name);
    if (!is_readable($path)) {
        rest_respond(404, ['success' => false, 'msg' => "Bin '$name' not found"]);
    }

    $content = file_get_contents($path);
    http_response_code(200);
    echo ($content === '' ? '{}' : $content);
    exit;
}

/** Create a new bin. Fails with 409 if it already exists. */
function rest_create($name)
{
    rest_require_access($name);
    $path = rest_path_for($name);
    if (file_exists($path)) {
        rest_respond(409, ['success' => false, 'msg' => "Bin '$name' already exists"]);
    }

    $body = rest_read_json_body();
    if (file_put_contents($path, $body) === false) {
        rest_respond(500, ['success' => false, 'msg' => 'Failed to create bin']);
    }
    rest_respond(201, ['success' => true, 'msg' => "Bin '$name' created", 'name' => $name]);
}

/** Replace the content of an existing bin. */
function rest_update($name)
{
    rest_require_access($name);
    $path = rest_path_for($name);
    if (!file_exists($path)) {
        rest_respond(404, ['success' => false, 'msg' => "Bin '$name' not found"]);
    }

    $body = rest_read_json_body();
    if (file_put_contents($path, $body) === false) {
        rest_respond(500, ['success' => false, 'msg' => 'Failed to update bin']);
    }
    rest_respond(200, ['success' => true, 'msg' => "Bin '$name' updated"]);
}

/** Delete a bin. */
function rest_delete($name)
{
    rest_require_access($name);
    $path = rest_path_for($name);
    if (!file_exists($path)) {
        rest_respond(404, ['success' => false, 'msg' => "Bin '$name' not found"]);
    }

    if (!unlink($path)) {
        rest_respond(500, ['success' => false, 'msg' => 'Failed to delete bin']);
    }
    rest_respond(200, ['success' => true, 'msg' => "Bin '$name' deleted"]);
}
