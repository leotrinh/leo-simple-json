<?php
/**
 * Admin endpoint to manage REST API keys from the UI.
 *
 * Protected by the SAME HTTP Basic Auth as the main app (AUTH_UID/AUTH_PWD).
 * This is NOT the j-api-key surface — it is for the logged-in admin only.
 *
 * Actions (?action=...):
 *   GET  list          -> all key records
 *   GET  files         -> available bin names (to pick allowed_files)
 *   POST create        -> body: {label, expire_at, allowed_files[], enabled}
 *   POST update        -> body: {id, label?, expire_at?, allowed_files?, enabled?}
 *   POST delete        -> body: {id}
 */

require_once(__DIR__ . '/../../leo-cfg.php');
require_once(__DIR__ . '/../rest/key-store.php');

header('Content-Type: application/json');

// --- Admin auth: reuse the app's Basic Auth credentials -------------------
if (
    !isset($_SERVER['PHP_AUTH_USER'])
    || $_SERVER['PHP_AUTH_USER'] !== $authUser
    || $_SERVER['PHP_AUTH_PW'] !== $authPwd
) {
    header('WWW-Authenticate: Basic realm="Restricted Area"');
    http_response_code(401);
    echo json_encode(['success' => false, 'msg' => 'Unauthorized']);
    exit;
}

function admin_json_body()
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/** List bin names from api/db. */
function admin_list_files()
{
    global $filePrefixAfter;
    $dir = __DIR__ . '/../db/';
    $names = [];
    foreach (glob($dir . '*' . $filePrefixAfter) as $file) {
        $names[] = pathinfo($file, PATHINFO_FILENAME);
    }
    return $names;
}

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET' && $action === 'list') {
    echo json_encode(['success' => true, 'data' => ks_list()]);
    exit;
}

if ($method === 'GET' && $action === 'files') {
    echo json_encode(['success' => true, 'data' => admin_list_files()]);
    exit;
}

if ($method === 'POST' && $action === 'create') {
    $b = admin_json_body();
    $label = trim($b['label'] ?? '');
    if ($label === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'msg' => 'Label is required']);
        exit;
    }
    $rec = ks_add(
        $label,
        admin_norm_expire($b['expire_at'] ?? null),
        admin_norm_files($b['allowed_files'] ?? []),
        $b['enabled'] ?? true
    );
    http_response_code(201);
    echo json_encode(['success' => true, 'data' => $rec]);
    exit;
}

if ($method === 'POST' && $action === 'update') {
    $b = admin_json_body();
    $id = $b['id'] ?? '';
    if ($id === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'msg' => 'id is required']);
        exit;
    }
    $fields = [];
    if (array_key_exists('label', $b)) $fields['label'] = trim($b['label']);
    if (array_key_exists('expire_at', $b)) $fields['expire_at'] = admin_norm_expire($b['expire_at']);
    if (array_key_exists('allowed_files', $b)) $fields['allowed_files'] = admin_norm_files($b['allowed_files']);
    if (array_key_exists('enabled', $b)) $fields['enabled'] = (bool) $b['enabled'];

    $rec = ks_update($id, $fields);
    if ($rec === null) {
        http_response_code(404);
        echo json_encode(['success' => false, 'msg' => 'Key not found']);
        exit;
    }
    echo json_encode(['success' => true, 'data' => $rec]);
    exit;
}

if ($method === 'POST' && $action === 'delete') {
    $b = admin_json_body();
    $id = $b['id'] ?? '';
    if (!ks_delete($id)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'msg' => 'Key not found']);
        exit;
    }
    echo json_encode(['success' => true, 'msg' => 'Key deleted']);
    exit;
}

http_response_code(400);
echo json_encode(['success' => false, 'msg' => 'Unknown action']);

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

/** Normalise expiry: accepts null/''/0 (= never) or a unix timestamp. */
function admin_norm_expire($v)
{
    if ($v === null || $v === '' || (int) $v === 0) {
        return null;
    }
    return (int) $v;
}

/** Normalise allowed_files to a clean string array. */
function admin_norm_files($v)
{
    if (!is_array($v)) {
        return [];
    }
    $out = [];
    foreach ($v as $name) {
        $name = trim((string) $name);
        if ($name !== '') {
            $out[] = $name;
        }
    }
    return array_values(array_unique($out));
}
