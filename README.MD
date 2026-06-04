
# Simple JSON api public

Store online JSON and public code by PHP basic not using any framework

## Tech Stack

**Client:** Boostrap, HTML, Js, CSS

**Server:** PHP


## REST API

Public CRUD API for the JSON store, located in `api/rest/`.

### Authentication

Every request must send an API key in the **`j-api-key`** header:

```
j-api-key: <api-key>
```

Keys are managed from the UI — log in, click **⚙ API Keys** (top-right) and
create keys with:

- **Label** — a name to identify the key
- **Expires at** — optional expiry (empty = never)
- **Allowed files** — restrict the key to specific bins (empty = all bins)

Keys are stored in `storage/api-keys.json` (blocked from web access). The
`REST_API_KEY` value in `.env` still works as an optional master key (full
access, never expires) for bootstrap.

Responses:

- `401 Unauthorized` — missing, invalid, disabled, or expired key
- `403 Forbidden` — valid key, but not allowed to access that bin

### Base URL

```
<host>/api/rest/
```

A bin name is passed either as a query param `?name=<bin>` or as a path
segment `/<bin>` (clean URLs require `mod_rewrite`).

### Endpoints

| Method | Path | Description | Body |
|--------|------|-------------|------|
| GET    | `/`            | List all bin names                 | — |
| GET    | `/?name=foo`   | Read content of bin `foo`          | — |
| POST   | `/?name=foo`   | Create bin `foo` (`409` if exists) | JSON (optional, defaults to `{}`) |
| PUT    | `/?name=foo`   | Replace bin content (`404` if missing) | JSON |
| DELETE | `/?name=foo`   | Delete bin `foo`                   | — |

Bin `foo` maps to the file `api/db/foo.LEO`.

### Status codes

| Code | Meaning |
|------|---------|
| `200` | OK (read / update / delete / list) |
| `201` | Bin created |
| `204` | CORS preflight (`OPTIONS`) |
| `400` | Invalid bin name (allowed: letters, digits, `_`, `-`, `.`) |
| `401` | Missing, invalid, disabled, or expired `j-api-key` |
| `403` | Key not allowed to access this bin |
| `404` | Bin not found |
| `409` | Bin already exists (on create) |
| `422` | Request body is not valid JSON |
| `500` | Server error / `REST_API_KEY` not configured |

### Examples (cURL)

```bash
KEY="<REST_API_KEY>"
BASE="http://localhost/api/rest"

# List all bins
curl -H "j-api-key: $KEY" "$BASE/"

# Read a bin
curl -H "j-api-key: $KEY" "$BASE/?name=DEPLOY_TARGET_ADMIN"

# Create a bin
curl -X POST -H "j-api-key: $KEY" -d '{"hello":"world"}' "$BASE/?name=my_bin"

# Update a bin
curl -X PUT -H "j-api-key: $KEY" -d '{"hello":"updated"}' "$BASE/?name=my_bin"

# Delete a bin
curl -X DELETE -H "j-api-key: $KEY" "$BASE/?name=my_bin"
```

### Notes

- Request bodies on `POST`/`PUT` are validated as JSON (this is a JSON store).
- Bin names are sanitized to block path traversal.
- CORS is open (`Access-Control-Allow-Origin: *`) with the `j-api-key` header allowed.


## Authors

- [@leotrinh](https://github.com/leotrinh)


## Contributing

Contributions are always welcome!

