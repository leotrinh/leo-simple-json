# System Architecture

**Version**: 2.0.0
**Date**: March 24, 2026

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser / Client                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                   (HTTP/HTTPS)
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
┌───────▼────────────────────────┐  ┌──────▼────────────────┐
│    Frontend (Next.js 16)       │  │  Static Assets        │
│  ┌──────────────────────────┐  │  │  (CSS, JS, Images)   │
│  │ Pages                    │  │  │                      │
│  │ - Login (public)         │  │  │  Served via CDN      │
│  │ - Bins (dashboard)       │  │  │  in production       │
│  │ - Admin (settings/users) │  │  │                      │
│  ├──────────────────────────┤  │  └──────────────────────┘
│  │ NextAuth Session         │  │
│  │ (JWT + User Role)        │  │
│  ├──────────────────────────┤  │
│  │ TanStack Query v5        │  │
│  │ (Data fetching/caching)  │  │
│  └──────────────────────────┘  │
│                                 │
│  Port: 3000/3002               │
└──────────────────┬──────────────┘
                   │
              (REST API)
                   │
        ┌──────────▼────────────┐
        │   API Gateway Layer   │  ← nginx (production)
        │   (Port 80/443)       │     handles /api routing
        └──────────┬────────────┘
                   │
    ┌──────────────┴──────────────┐
    │                             │
┌───▼──────────────────────┐  ┌──▼──────────────────────────┐
│  Backend API             │  │  Public Read Cache          │
│  (Express.js)            │  │  (Static JSON files)        │
│  Port: 3001              │  │  (/api/v2?target=slug)      │
├─────────────────────────┤  │                             │
│ Routes:                 │  │  Path: backend/data/{slug}.json
│ - /auth/* (login/reg)   │  │                             │
│ - /bins/* (CRUD)        │  │  No auth needed            │
│ - /admin/users/* (CRUD) │  │  Minimal DB load           │
│ - /settings/* (config)  │  └──────────────────────────┘
├─────────────────────────┤
│ Middleware:             │
│ - JWT auth              │
│ - Admin role check      │
│ - Error handling        │
├─────────────────────────┤
│ Services:               │
│ - BinService (CRUD)     │
│ - CacheService (sync)   │
└───┬──────────────────────┘
    │
    │ (MongoDB Driver)
    │
┌───▼──────────────────────┐
│  Database                │
│  (MongoDB 7)             │
│  Port: 27017             │
├─────────────────────────┤
│ Collections:            │
│ - users                 │
│ - jsonbins              │
│ - settings              │
├─────────────────────────┤
│ Volumes:                │
│ - mongo_data            │
│ - bin_cache             │
└──────────────────────────┘
```

---

## Component Interaction Diagram

```
USER ACTIONS                 FRONTEND                  BACKEND

Login Form
  ↓                          POST /auth/login
  ├─────────────────────────────→  Express Route
  │                                  ├─ Validate credentials
  │                         ← ──────┤  ├─ Hash check (bcrypt)
  │      JWT Token returned         ├─ Sign JWT
  │                                  └─ Return user + token
  │
Create Bin
  │                          POST /bins
  ├────────────────────────────→  Auth middleware ✓
  │                                 BinService.createBin()
  │                                 ├─ JsonBin.create() → DB
  │                    ← ──────────┤─ writeCache() → File
  │      Bin created                └─ Return bin
  │
Update Bin Content
  │                          PUT /bins/:slug
  ├────────────────────────────→  Auth middleware ✓
  │                                 BinService.updateBin()
  │                                 ├─ JsonBin.findOneAndUpdate() → DB
  │                    ← ──────────┤─ writeCache() → File sync
  │      Updated                    └─ Return updated bin
  │
Public Read (No Auth!)
  │                          GET /api/v2?target=slug
  ├────────────────────────────→  No middleware
  │                                 readCache(slug)
  │                    ← ──────────┤  File read only
  │      JSON content returned      └─ Return file content
  │
Admin: Delete User
  │                          DELETE /admin/users/:id
  ├────────────────────────────→  Auth + Admin check ✓
  │                                 ├─ Find all user bins
  │                                 ├─ deleteCache() for each
  │                    ← ──────────┤─ JsonBin.deleteMany()
  │      User deleted               └─ User.findByIdAndDelete()
  │
```

---

## Data Flow: Write-Through Cache

```
User updates bin content
        ↓
TanStack Query mutation
        ↓
API client: PUT /api/v2/bins/:slug
        ↓
Express route handler
        ↓
binService.updateBin()
        ├─→ JsonBin.findOneAndUpdate()  [DB WRITE]
        │   ├─ { $set: { content, updatedAt, ... } }
        │   └─ { new: true }
        │
        └─→ writeCache(bin.slug, bin.content)  [FILE WRITE]
            ├─ fs.writeFile('backend/data/{slug}.json')
            └─ Content stays in sync
        ↓
Return updated bin to frontend
        ↓
Frontend: QueryClient.invalidateQueries(['bins'])
        ↓
Re-fetch bins list + update UI
```

### Why Write-Through?
- **Consistency**: DB + file always in sync
- **Performance**: Public API reads files (no DB overhead)
- **Simplicity**: Single source of truth logic
- **Durability**: File cache survives DB outages

---

## Authentication & Authorization Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     LOGIN FLOW                              │
└─────────────────────────────────────────────────────────────┘

User enters email + password
        ↓
Frontend: NextAuth.signIn('credentials', { email, password })
        ↓
NextAuth Credentials provider callback
        ↓
Fetch: POST http://leo-json-backend:3001/api/v2/auth/login
       (BACKEND_URL — internal Docker only)
        ↓
Backend: auth-routes.js
  1. Find user by email
  2. Compare password (bcrypt.compare)
  3. Sign JWT: jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: '7d' })
  4. Return { token, user }
        ↓
NextAuth stores in callbacks:
  jwt(): token.backendToken = token (from authorize)
         token.role = user.role
        ↓
  session(): session.user.backendToken = token.backendToken
             session.user.role = token.role
        ↓
Browser: Encrypted session cookie (AUTH_SECRET)
        ↓
Frontend: useSession() → { user: { id, name, email, role, backendToken } }

┌─────────────────────────────────────────────────────────────┐
│                  PROTECTED ROUTE FLOW                       │
└─────────────────────────────────────────────────────────────┘

Frontend component:
  const { data: session } = useSession()
  if (!session) redirect('/login')
        ↓
Render dashboard
        ↓
Fetch data:
  const { data } = api('GET', '/api/v2/bins')
        ↓
API client (api-client.ts):
  const token = session.user.backendToken
  headers: { Authorization: `Bearer ${token}` }
        ↓
Backend middleware (auth.js):
  1. Extract token from Authorization header
  2. jwt.verify(token, JWT_SECRET)
  3. Set req.user = { id, email, role }
  4. Next()
        ↓
Route handler:
  req.user.id available for queries
  Example: listBins(req.user.id, ...)
        ↓
Response

┌─────────────────────────────────────────────────────────────┐
│                   ADMIN-ONLY FLOW                           │
└─────────────────────────────────────────────────────────────┘

Frontend:
  if (session.user.role !== 'admin') return <Unauthorized />
        ↓
  API call: GET /api/v2/admin/users
        ↓
Backend route uses two middleware:
  router.use(requireAuth)          ← JWT check
  router.use(requireAdmin)         ← role === 'admin' check
        ↓
If any check fails: 403 Forbidden
        ↓
If pass: Handler executes (User.find())
```

---

## Database Schema & Relationships

```
┌─────────────────────────────────────┐
│         users Collection            │
├─────────────────────────────────────┤
│ _id: ObjectId (PK)                  │
│ email: String (unique)              │
│ name: String                        │
│ picture: String (optional)          │
│ provider: 'local' | 'google'        │
│ passwordHash: String (local only)   │
│ role: 'admin' | 'user'              │
│ createdAt: Date                     │
│ updatedAt: Date                     │
│                                     │
│ Indexes: email (unique)             │
└────────────┬──────────────────────┘
             │
             │ 1:N
             │
             ├──────────────────────┐
             │                      │
┌────────────▼──────────────────┐  │
│    jsonbins Collection         │  │
├────────────────────────────────┤  │
│ _id: ObjectId (PK)             │  │
│ userId: ObjectId (FK) ────┐    │  │
│ name: String              │    │  │
│ slug: String (unique)     │    │  │
│ group: String             │    │  │
│ content: Object (any JSON)│    │  │
│ isPublic: Boolean         │    │  │
│ createdAt: Date           │    │  │
│ updatedAt: Date           │    │  │
│                            │    │  │
│ Indexes:                   │    │  │
│ - slug (unique)            │    │  │
│ - userId, group            │    │  │
└────────────────────────────┘    │  │
                                  │  │
                                  └──┘

┌─────────────────────────────────────┐
│      settings Collection            │
├─────────────────────────────────────┤
│ _id: ObjectId (PK)                  │
│ key: String (unique)                │
│ value: Any                          │
│                                     │
│ Example documents:                  │
│ { key: 'allowRegistration', value: false }
│ { key: 'logoUrl', value: 'https://...' }
│ { key: 'siteName', value: 'JSON Manager' }
│                                     │
│ Indexes: key (unique)               │
└─────────────────────────────────────┘

Invariants:
✓ Every jsonbin has a valid userId reference
✓ No orphaned bins when user deleted (cascade delete)
✓ Slug uniqueness enforced at DB level
✓ User email uniqueness enforced
```

---

## File Cache Structure

```
backend/
├── data/                          [gitignored, volume mounted]
│   ├── my-first-bin.json          File contains JSON content
│   ├── api-config.json            (no metadata, pure content)
│   ├── user-dashboard-v2.json
│   └── ...
│
└── src/services/cache-service.js
    ├─ readCache(slug)
    │   └─ fs.readFile('data/{slug}.json')
    │       └─ JSON.parse()
    │
    ├─ writeCache(slug, content)
    │   └─ fs.writeFile('data/{slug}.json', JSON.stringify(content))
    │       └─ Overwrites if exists
    │
    └─ deleteCache(slug)
        └─ fs.unlink('data/{slug}.json')
            └─ No-op if not exists
```

### Cache Lifetime
| Event | Action |
|-------|--------|
| Container start | Files persist (volume mounted) |
| Create bin | Write file |
| Update bin | Overwrite file |
| Change slug | Delete old, write new |
| Delete bin | Delete file |
| Container stop | Files survive (volume) |
| Volume delete | Files lost (no backup) |

---

## API Request/Response Cycle

```
Browser (Frontend)
  ↓
NextAuth Session ready (JWT in memory + cookie)
  ↓
TanStack Query mutation trigger:
  mutateAsync({ name: 'My Bin', content: {...} })
  ↓
API Client wrapper (lib/api-client.ts):
  ├─ Get session from NextAuth
  ├─ Extract: session.user.backendToken
  ├─ Prepare headers:
  │  { Authorization: 'Bearer <jwt>', 'Content-Type': 'application/json' }
  ├─ JSON.stringify(body)
  └─ fetch(url, { method, headers, body })
  ↓
Network: HTTP POST /api/v2/bins (3001 internal or proxy via nginx)
  ↓
Express app (backend/src/app.js):
  ├─ CORS check (origin = FRONTEND_URL)
  └─ Route: router.use('/api/v2/bins', binRoutes)
  ↓
Middleware stack (binRoutes):
  1. requireAuth middleware:
     ├─ Extract token from Authorization header
     ├─ jwt.verify(token, JWT_SECRET)
     ├─ req.user = { id, email, role }
     └─ Next if valid, 401 if not

  2. Route handler:
     router.post('/', async (req, res) => {
       const bin = await binService.createBin(req.user.id, req.body)
       res.status(201).json({ success: true, data: bin })
     })
  ↓
BinService.createBin():
  ├─ Validate slug (regex test)
  ├─ Check slug uniqueness (JsonBin.findOne())
  ├─ Create in DB: JsonBin.create({ userId, name, ... })
  ├─ Write to file: await writeCache(bin.slug, content)
  └─ Return bin object
  ↓
Response headers:
  ├─ HTTP 201 Created
  ├─ Content-Type: application/json
  └─ body: { success: true, data: { _id, slug, name, ... } }
  ↓
Frontend receives JSON
  ↓
TanStack Query mutation success:
  ├─ Update cache
  ├─ queryClient.invalidateQueries(['bins'])
  ├─ Re-fetch bins list
  └─ Update UI
  ↓
User sees new bin in list
```

---

## Docker Network & Service Discovery

```
┌─────────────────────────────────────────────────────────────┐
│           Docker Compose (docker-compose.yml)               │
└─────────────────────────────────────────────────────────────┘

Networks:
  app-net (bridge)
    ├─ mongodb:27017 (internal only)
    ├─ leo-json-backend:3001 (port 3001 exposed, hostname: leo-json-backend)
    └─ leo-json-frontend:3000 (port 3002 exposed, hostname: leo-json-frontend)

Service Communication:
  Frontend needs to reach Backend:
    ├─ From browser: http://localhost:3001 (or NEXT_PUBLIC_API_URL)
    └─ From server (NextAuth callback): http://leo-json-backend:3001 (BACKEND_URL)

  Backend needs to reach MongoDB:
    └─ mongodb://root:root123@mongodb:27017/leo_json (MONGO_URI)
       (hostname: mongodb — service name resolved by Docker DNS)

Frontend Build Args:
  ├─ NEXT_PUBLIC_API_URL env var passed at build time
  ├─ Next.js inlines into JavaScript bundle
  └─ If not set: defaults to http://localhost:3001

Volume Mounts:
  ├─ mongo_data → MongoDB /data/db (persistent)
  └─ bin_cache → Backend /app/data (persistent file cache)

Environment Variables:
  MongoDB:
    ├─ MONGO_INITDB_ROOT_USERNAME: root
    ├─ MONGO_INITDB_ROOT_PASSWORD: root123
    └─ MONGO_INITDB_DATABASE: leo_json

  Backend:
    ├─ PORT: 3001
    ├─ MONGO_URI: mongodb://root:root123@mongodb:27017/leo_json?authSource=admin
    ├─ JWT_SECRET: ${JWT_SECRET:-change_me...}
    ├─ FRONTEND_URL: ${FRONTEND_URL:-http://localhost:3002}
    ├─ GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:-}
    └─ GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET:-}

  Frontend:
    ├─ NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-http://localhost:3001}
    ├─ AUTH_SECRET: ${AUTH_SECRET:-change_me...}
    ├─ AUTH_URL: ${AUTH_URL:-http://localhost:3002}
    ├─ BACKEND_URL: http://leo-json-backend:3001 (server-side only)
    ├─ AUTH_TRUST_HOST: true
    ├─ GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:-}
    └─ GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET:-}
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│             BACKEND ERROR HANDLING                          │
└─────────────────────────────────────────────────────────────┘

Service throws error:
  throw Object.assign(new Error('Slug already taken'), { status: 409 })

        ↓
Express async handler (express-async-errors):
  Catches promise rejection/throw
        ↓
Global error handler (middleware/error-handler.js):
  if (err.status) {
    res.status(err.status).json({ success: false, msg: err.message })
  } else {
    res.status(500).json({ success: false, msg: err.message })
  }
        ↓
Response sent to frontend:
  ├─ Status: 409 (or 500, 400, 404, 401, 403)
  └─ Body: { success: false, msg: 'Slug already taken' }

┌─────────────────────────────────────────────────────────────┐
│             FRONTEND ERROR HANDLING                         │
└─────────────────────────────────────────────────────────────┘

API call fails:
  const { data } = await api('POST', '/api/v2/bins', {...})

        ↓
api-client.ts:
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.msg)
  }
        ↓
TanStack Query catches:
  mutation.isError = true
  mutation.error = Error object
        ↓
Component handles:
  {isPending && <Spinner />}
  {isError && <Toast error={error.message} />}
        ↓
User sees toast notification with error message
```

---

## Scaling Considerations

| Component | Current | Bottleneck | Solution |
|-----------|---------|-----------|----------|
| MongoDB | Single instance | Concurrent writes | Replication set |
| Backend | Single process | CPU-bound ops | Horizontal scale (load balancer) |
| Frontend | Static build | Large bundle | Code splitting, lazy load |
| File cache | Local filesystem | Single disk | Distributed cache (Redis) |
| Session | Memory (NextAuth) | Crash loss | Redis store |

---

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│               SECURITY CHECKLIST                            │
└─────────────────────────────────────────────────────────────┘

Frontend:
  ✓ HTTPS enforced (production)
  ✓ NextAuth session encryption (AUTH_SECRET)
  ✓ Secure cookie flag (httpOnly, secure, sameSite)
  ✓ CSRF token in NextAuth
  ✓ Input validation (zod/form)
  ✓ XSS prevention (React escapes by default)
  ✓ Admin role check before rendering admin routes

Backend:
  ✓ CORS whitelist (FRONTEND_URL)
  ✓ JWT signature verification (JWT_SECRET)
  ✓ Password hashing (bcryptjs, 12 rounds)
  ✓ Admin middleware checks role
  ✓ Input validation (slug regex)
  ✓ No stack traces in responses (error handler)
  ✓ Helmet headers recommended (not implemented)

Database:
  ✓ MongoDB authentication (root user)
  ✓ No public exposure (internal Docker network)
  ✓ Field validation (Mongoose schemas)

Infrastructure:
  ⚠ Reverse proxy (nginx) recommended (not in compose)
  ⚠ Rate limiting (not implemented)
  ⚠ WAF headers (not implemented)
  ⚠ Log aggregation (not implemented)
```

---

## Deployment Architecture (Production)

```
┌────────────────────────────────────────────────────────────┐
│                     CDN / Cloudflare                        │
│                  (Static assets, caching)                   │
└───────────────────┬────────────────────────────────────────┘
                    │
                    │ (HTTPS)
                    │
┌───────────────────▼────────────────────────────────────────┐
│              Reverse Proxy / Load Balancer                  │
│  (nginx or cloud provider load balancer)                    │
│  ├─ SSL termination                                        │
│  ├─ Route /api/* → Backend                                 │
│  ├─ Route / → Frontend                                     │
│  └─ Rate limiting, WAF rules                               │
└───────────────────┬────────────────────────────────────────┘
                    │
        ┌───────────┴──────────┐
        │                      │
┌───────▼──────────┐  ┌──────▼─────────────────┐
│  Frontend Pods   │  │   Backend Pods        │
│  (Next.js, k8s) │  │   (Express, k8s)      │
│  Replicas: 2-5  │  │   Replicas: 2-10      │
│  Scaling: HPA   │  │   Scaling: HPA + CPU  │
│                 │  │   autoscale           │
└─────────────────┘  └──────┬─────────────────┘
                            │
                ┌───────────┴────────────┐
                │                        │
        ┌───────▼──────────┐  ┌─────────▼────────────┐
        │  MongoDB Cluster │  │   Redis Cache        │
        │  (Atlas/Managed) │  │   (Session store)    │
        │  Replication: 3+ │  │   (File cache)       │
        │  Backups: daily  │  │   TTL: configurable  │
        └──────────────────┘  └──────────────────────┘
```

