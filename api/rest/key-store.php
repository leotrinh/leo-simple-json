<?php
/**
 * API key store backed by a JSON file (storage/api-keys.json).
 *
 * No external DB extension required. Used by both the REST auth layer
 * (api/rest/lib.php) and the admin settings endpoint (api/admin/keys.php).
 *
 * Record shape:
 *   {
 *     "id":            "k_<hex>",
 *     "label":         "Human label",
 *     "key":           "rest_<secret>",
 *     "expire_at":     1730000000 | null,   // unix ts, null = never expires
 *     "allowed_files": ["FOO", "BAR"],       // [] = all files allowed
 *     "enabled":       true,
 *     "created_at":    1730000000
 *   }
 */

/** Absolute path to the JSON store (kept outside the web-served api/ tree). */
function ks_store_path()
{
    return __DIR__ . '/../../storage/api-keys.json';
}

/** Load the store; returns ['keys' => [...]] and self-heals a missing file. */
function ks_load()
{
    $path = ks_store_path();
    if (!file_exists($path)) {
        return ['keys' => []];
    }
    $raw = file_get_contents($path);
    $data = json_decode($raw, true);
    if (!is_array($data) || !isset($data['keys']) || !is_array($data['keys'])) {
        return ['keys' => []];
    }
    return $data;
}

/** Persist the store atomically. Returns bool. */
function ks_save($data)
{
    $path = ks_store_path();
    $dir = dirname($path);
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    return file_put_contents($path, $json, LOCK_EX) !== false;
}

/** Generate a new opaque secret key. */
function ks_generate_key()
{
    return 'rest_' . bin2hex(random_bytes(24));
}

/** Find an enabled record whose secret matches (constant-time). null if none. */
function ks_find_by_secret($secret)
{
    if ($secret === '' || $secret === null) {
        return null;
    }
    foreach (ks_load()['keys'] as $rec) {
        if (hash_equals((string) $rec['key'], (string) $secret)) {
            return $rec;
        }
    }
    return null;
}

/** True if the record is enabled and not past its expiry. */
function ks_is_active($rec)
{
    if (empty($rec['enabled'])) {
        return false;
    }
    if (!empty($rec['expire_at']) && time() >= (int) $rec['expire_at']) {
        return false;
    }
    return true;
}

/** True if the record may access the given bin name. [] allowed_files = all. */
function ks_can_access($rec, $binName)
{
    $allowed = isset($rec['allowed_files']) ? $rec['allowed_files'] : [];
    if (!is_array($allowed) || count($allowed) === 0) {
        return true;
    }
    return in_array($binName, $allowed, true);
}

// --------------------------------------------------------------------------
// Admin CRUD (used by api/admin/keys.php)
// --------------------------------------------------------------------------

/** Return all key records. */
function ks_list()
{
    return ks_load()['keys'];
}

/** Create a key. Returns the new record. */
function ks_add($label, $expire_at, $allowed_files, $enabled = true)
{
    $data = ks_load();
    $rec = [
        'id' => 'k_' . bin2hex(random_bytes(8)),
        'label' => (string) $label,
        'key' => ks_generate_key(),
        'expire_at' => $expire_at !== null ? (int) $expire_at : null,
        'allowed_files' => is_array($allowed_files) ? array_values($allowed_files) : [],
        'enabled' => (bool) $enabled,
        'created_at' => time(),
    ];
    $data['keys'][] = $rec;
    ks_save($data);
    return $rec;
}

/** Update mutable fields of a key by id. Returns updated record or null. */
function ks_update($id, $fields)
{
    $data = ks_load();
    foreach ($data['keys'] as $i => $rec) {
        if ($rec['id'] !== $id) {
            continue;
        }
        foreach (['label', 'expire_at', 'allowed_files', 'enabled'] as $f) {
            if (array_key_exists($f, $fields)) {
                $rec[$f] = $fields[$f];
            }
        }
        $data['keys'][$i] = $rec;
        ks_save($data);
        return $rec;
    }
    return null;
}

/** Delete a key by id. Returns bool. */
function ks_delete($id)
{
    $data = ks_load();
    $before = count($data['keys']);
    $data['keys'] = array_values(array_filter(
        $data['keys'],
        function ($rec) use ($id) {
            return $rec['id'] !== $id;
        }
    ));
    if (count($data['keys']) === $before) {
        return false;
    }
    return ks_save($data);
}
