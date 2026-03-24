# Codebase Summary

**Version**: 2.0.0
**Last Updated**: March 24, 2026
**Tech Stack**: Node.js/Express + Next.js 16 + MongoDB

---

## Quick Navigation

- **Backend**: Express.js REST API (port 3001)
- **Frontend**: Next.js SSR app (port 3002)
- **Database**: MongoDB 7 (27017)
- **File Cache**: Local filesystem at `backend/data/`

---

## Backend Overview

### Core Modules (backend/src/)

#### app.js (60 lines)
- Express server setup with CORS middleware
- Public endpoint: `GET /api/v2?target=slug` (file cache read, no auth)
- Route mounting: auth, bins, admin/users, settings
- Global error handler middleware
- MongoDB connection + default settings seeding

#### Routes (4 files, ~64-60 lines each)

**auth-routes.js**: Authentication endpoints
- `POST /auth/register` — Create local user (if registration enabled)
- `POST /auth/login` — Authenticate, return JWT + user
- `GET /auth/me` — Current user profile (requires auth)
- Password hashing: bcryptjs (12 rounds)
- Token: JWT signed with `JWT_SECRET`, 7-day expiry

**bin-routes.js**: JSON Bin CRUD
- `GET /bins/groups` — List user's unique groups
- `GET /bins?group=default` — List bins (optional group filter)
- `POST /bins` — Create bin (auto-generate slug or use custom)
- `GET /bins/:slug` — Fetch one bin by slug
- `PUT /bins/:slug` — Update bin (name, group, content, isPublic, slug)
- `DELETE /bins/:slug` — Delete bin + invalidate cache
- Slug validation: `/^[a-zA-Z0-9_-]{3,50}$/`
- All routes require auth

**user-routes.js**: Admin user management
- `POST /admin/users` — Create new user (admin only)
- `GET /admin/users` — List all users
- `PATCH /admin/users/:id/role` — Toggle user role (admin only)
- `DELETE /admin/users/:id` — Delete user + all bins + cache files
- All routes require auth + admin role

**setting-routes.js**: Settings CRUD
- `GET /settings/public` — Allowed fields (allowRegistration, logoUrl, siteName) - **no auth**
- `GET /settings` — All settings (admin only)
- `PATCH /settings/:key` — Upsert setting value (admin only)
- Safe fields auto-returned with defaults if not seeded

#### Services (2 files)

**bin-service.js** (66 lines): Bin business logic
```
Export functions:
- listBins(userId, group?) — Find user's bins, exclude content
- listGroups(userId) — Distinct group list, sorted
- createBin(userId, {name, group, content, isPublic, slug}) — DB + cache write
- getBin(slug, userId) — Fetch one bin
- updateBin(slug, userId, updates) — Partial update + slug change handling
- deleteBin(slug, userId) — DB delete + cache invalidation

Slug change logic:
1. Check new slug uniqueness
2. Update DB
3. Delete old cache file
4. Write new cache file with updated content
```

**cache-service.js**: Write-through file caching
```
Functions:
- readCache(target) — Read .json from backend/data/{target}.json
- writeCache(slug, content) — Write/overwrite .json file
- deleteCache(slug) — Remove .json file
- Used on: create, update (any content change), delete

Strategy: Every DB write triggers file sync
Purpose: Public API reads files, avoiding DB load
Persistence: Lost on container restart unless volume mounted
```

#### Middleware (3 files)

**auth.js**: JWT extraction & verification
- Header: `Authorization: Bearer <token>`
- Extracts: `req.user = { id, email, role }`
- On failure: 401 Unauthorized

**error-handler.js**: Global async error catch
- Catches errors with `status` property → HTTP response
- Default 500 if no status set
- Logs error message (production should use logger)

**require-admin.js**: Role check
- Verifies `req.user.role === 'admin'`
- 403 Forbidden if user is not admin

#### Models (3 Mongoose schemas)

**user.js** (24 lines)
- Fields: email (unique, lowercase), name, picture, provider, passwordHash, role
- Timestamps: createdAt, updatedAt
- Serialization: passwordHash never exposed in responses

**json-bin.js** (15 lines)
- Fields: userId (ref), name, slug (unique), group, content (any), isPublic
- Timestamps: createdAt, updatedAt
- Indexes: slug (unique), userId + group

**setting.js** (8 lines)
- Fields: key (unique), value (any)
- Use: allowRegistration, logoUrl, siteName
- No timestamps (single upsert pattern)

#### Configuration & Scripts

**config/db.js**: MongoDB connection wrapper
- Reads `MONGO_URI` from env
- Exports: `connectDB()` async function

**scripts/seed-admin.js**: One-time admin setup
- Usage: `node src/scripts/seed-admin.js [email] [password]`
- Creates or promotes existing user to admin
- Safe: idempotent (skips if admin exists)

### Backend Dependencies
```json
{
  "express": "4.19.2",           // Web framework
  "cors": "2.8.5",               // Cross-origin
  "express-async-errors": "3.1.1",  // Auto-catch in async handlers
  "mongoose": "8.3.4",           // MongoDB ODM
  "jsonwebtoken": "9.0.2",       // JWT signing/verification
  "bcryptjs": "2.4.3",           // Password hashing
  "dotenv": "16.4.5",            // Env var loading
  "nanoid": "5.0.7",             // Slug generation (unused in v2?)
  "passport": "0.7.0"            // Auth middleware (unused in v2?)
}
```

---

## Frontend Overview

### Core Pages (frontend/src/app/)

**layout.tsx**: Root layout
- Fonts: Plus_Jakarta_Sans (body), JetBrains_Mono (code)
- Metadata: title, description
- Providers wrapper (NextAuth, QueryClient)

**page.tsx**: Home/redirect
- Likely redirects to /bins or /login based on auth status

**(auth)/ directory**: Auth layout group
- **login/page.tsx**: Login form (email/password + Google button)
  - Calls NextAuth signIn (credentials or google provider)
  - Redirects to `/bins` on success
  - Public page (no auth guard)

**(dashboard)/ directory**: Protected layout group
- **layout.tsx**: Main app layout with sidebar, nav, user menu
  - Checks `useSession()` → redirects to /login if no session
  - Routes: Bins, Admin (users, settings)

- **bins/page.tsx**: Bins list
  - Fetches bins from `useBins()`
  - Displays grid/table with name, group, slug, created date
  - Actions: Create new, Edit, Delete, Public toggle

- **bins/new/page.tsx**: Create bin form
  - Inputs: name, slug (optional), group, content (Monaco editor)
  - Submit: `mutate({ name, slug, group, content })`
  - On success: redirect to `/bins/{slug}`

- **bins/[slug]/page.tsx**: Edit bin
  - Fetch bin by slug
  - Form: name, group, content (Monaco), slug, public toggle
  - Actions: Save, Delete, Duplicate
  - Slug change: Validate uniqueness, confirm, update with cache sync

- **admin/users/page.tsx**: User management
  - Table: email, name, role, created date
  - Actions: Create user, toggle admin role, delete user
  - Requires admin role

- **admin/settings/page.tsx**: Settings editor
  - Form: allowRegistration (toggle), logoUrl (text), siteName (text)
  - Pulls from `useSettings()`
  - Save: PATCH each setting

### Components

**providers.tsx**: Setup wrapper
```typescript
- NextAuthSessionProvider
- QueryClientProvider
- Sonner toasts
- Renders children
```

**bin-editor.tsx**: Monaco editor component
- Language: json
- Props: value, onChange
- Features: Syntax highlighting, validation
- Debounced onChange to avoid excessive renders

**confirm-dialog.tsx**: Reusable confirmation modal
- Replaces all `window.confirm()` calls
- Context-based (useConfirm hook)
- Title, message, confirm/cancel buttons
- Returns promise (boolean)

**ui/**: shadcn/ui component library
- Button, Input, Label, Card, Dialog, Dropdown, Badge, Switch, Table, etc.

### Hooks (TanStack Query v5)

**use-bins.ts**: Bin CRUD operations
```typescript
- useQuery('bins') → GET /bins → returns { data: bins[] }
- useMutation create → POST /bins
- useMutation update → PUT /bins/:slug
- useMutation delete → DELETE /bins/:slug
- Auto-invalidation on mutation success
```

**use-users.ts**: Admin user operations
```typescript
- useQuery('admin/users') → GET /admin/users → returns users[]
- useMutation create → POST /admin/users
- useMutation toggleRole → PATCH /admin/users/:id/role
- useMutation delete → DELETE /admin/users/:id
```

**use-settings.ts**: Settings operations
```typescript
- useQuery('settings') → GET /settings
- useMutation update → PATCH /settings/:key
```

### Libraries & Config

**lib/auth.ts**: NextAuth configuration
```typescript
Providers:
- Credentials: POST to /api/v2/auth/login, returns token + user
- Google: OAuth 2.0 (requires GOOGLE_CLIENT_ID/SECRET)

Callbacks:
- jwt(): Persist backendToken + role to JWT
- session(): Add to session.user object

Pages:
- signIn: /login
```

**lib/api-client.ts**: Fetch wrapper
```typescript
- Auto-injects Authorization header (session.user.backendToken)
- JSON serialization/deserialization
- Error handling

Signature: api(method, path, body?, options?)
Usage: const data = await api('POST', '/api/v2/bins', { ... })
```

**lib/utils.ts**: Utilities
- `cn()`: Tailwind class merge (clsx + tailwind-merge)
- Date formatting functions
- Validation helpers

### Types (frontend/src/types/index.ts)

Shared TypeScript interfaces (55 lines):
- `User` — Extended NextAuth user type with role, backendToken
- `JsonBin` — Bin object from API
- `CreateBinInput`, `UpdateBinInput` — Request payloads
- `PublicSettings`, `Setting` — Settings objects
- `CreateUserInput` — Admin user creation

### Styling

**globals.css**: Tailwind + custom CSS
- CSS variables for theme (dark/light)
- Custom fonts (Jakarta, JetBrains Mono)
- Reset styles
- Utility classes

---

## Docker & Deployment

### docker-compose.yml

**Services**:
1. **mongodb** (mongo:7)
   - Port: 27017
   - Creds: root / root123
   - Volume: mongo_data (persistent)

2. **backend** (node:20-alpine)
   - Port: 3001
   - Build context: ./backend
   - Env: MONGO_URI, JWT_SECRET, FRONTEND_URL, Google OAuth
   - Volume: bin_cache (persistent file cache)

3. **frontend** (node:20-alpine)
   - Port: 3002
   - Build context: ./frontend
   - Env: NEXT_PUBLIC_API_URL (baked at build), AUTH_SECRET, BACKEND_URL (internal)
   - Multi-stage build → standalone output

**Network**: app-net (internal bridge)

### Dockerfiles

**backend/Dockerfile**
```dockerfile
FROM node:20-alpine
COPY package.json, npm install
COPY src/
RUN mkdir -p data (for cache)
EXPOSE 3001
CMD ["node", "src/app.js"]
```

**frontend/Dockerfile**
```dockerfile
# Stage 1: builder
FROM node:20-alpine AS builder
COPY ., npm install, npm run build

# Stage 2: runner (standalone)
FROM node:20-alpine AS runner
COPY --from=builder .next/standalone ./
COPY --from=builder .next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## API Endpoints

### Public (No Auth)
```
GET /api/v2?target=slug-name
→ { success: true, data: <JSON from cache> }
→ 404 if target not found

GET /api/v2/settings/public
→ { success: true, data: { allowRegistration, logoUrl, siteName } }
```

### Auth Required

**POST /api/v2/auth/register** (if enabled)
```
Body: { email, name, password }
Response: { success: true, token, user }
```

**POST /api/v2/auth/login**
```
Body: { email, password }
Response: { success: true, token, user }
```

**GET /api/v2/auth/me**
```
Response: { success: true, user }
```

**GET /api/v2/bins** (list)
```
Query: ?group=default
Response: { success: true, data: bins[] }
```

**GET /api/v2/bins/groups** (unique groups)
```
Response: { success: true, data: ['default', 'api', ...] }
```

**POST /api/v2/bins** (create)
```
Body: { name, slug?, group?, content?, isPublic? }
Response: { success: true, data: bin }
```

**GET /api/v2/bins/:slug** (read one)
```
Response: { success: true, data: bin }
```

**PUT /api/v2/bins/:slug** (update)
```
Body: { name?, group?, content?, isPublic?, slug? }
Response: { success: true, data: bin }
```

**DELETE /api/v2/bins/:slug**
```
Response: 204 No Content
```

### Admin Only (Auth + Role Check)

**POST /api/v2/admin/users** (create)
```
Body: { email, name, password, role? }
Response: { success: true, data: user }
```

**GET /api/v2/admin/users** (list all)
```
Response: { success: true, data: users[] }
```

**PATCH /api/v2/admin/users/:id/role** (toggle)
```
Body: { role: 'admin' | 'user' }
Response: { success: true, data: user }
```

**DELETE /api/v2/admin/users/:id**
```
Response: 204 No Content
```

**GET /api/v2/settings** (all)
```
Response: { success: true, data: [{ key, value }, ...] }
```

**PATCH /api/v2/settings/:key** (update)
```
Body: { value: any }
Response: { success: true, data: { key, value } }
```

---

## File Cache Architecture

### Structure
```
backend/data/
├── {slug1}.json
├── {slug2}.json
└── ...
```

### Write-Through Pattern
1. **Create bin**: `await JsonBin.create(...)` + `await writeCache(slug, content)`
2. **Update bin**: `await JsonBin.findOneAndUpdate(...)` + `await writeCache(slug, content)`
3. **Update slug**: `await deleteCache(oldSlug)` + `await writeCache(newSlug, content)`
4. **Delete bin**: `await JsonBin.findOneAndDelete(...)` + `await deleteCache(slug)`

### Public Read
- `GET /api/v2?target=slug` reads from `backend/data/{slug}.json`
- No DB hit
- 404 if file missing

### Persistence
- Mounted as volume in Docker (`bin_cache:/app/data`)
- Survives container restart if volume persists
- Lost if volume is removed

---

## Configuration & Secrets

### Required Environment Variables

**Backend**
```
PORT=3001
MONGO_URI=mongodb://root:root123@mongodb:27017/leo_json?authSource=admin
JWT_SECRET=<32+ random chars>
FRONTEND_URL=http://localhost:3002 (or your domain)
GOOGLE_CLIENT_ID=<optional>
GOOGLE_CLIENT_SECRET=<optional>
```

**Frontend**
```
NEXT_PUBLIC_API_URL=http://localhost:3001 (or your domain)
AUTH_SECRET=<32+ random chars>
AUTH_URL=http://localhost:3002 (or your domain)
BACKEND_URL=http://leo-json-backend:3001 (internal Docker only)
AUTH_TRUST_HOST=true
GOOGLE_CLIENT_ID=<optional>
GOOGLE_CLIENT_SECRET=<optional>
```

### Defaults (if not set)
- PORT: 3001
- FRONTEND_URL: http://localhost:3002
- NEXT_PUBLIC_API_URL: http://localhost:3001
- AUTH_URL: http://localhost:3002

---

## Development Workflow

### Backend
```bash
cd backend
npm install
npm run dev        # node --watch src/app.js
```

### Frontend
```bash
cd frontend
npm install
npm run dev        # next dev (port 3000, auto-reload)
```

### Docker
```bash
docker-compose up  # All services
```

### Seed Admin
```bash
docker exec leo-json-backend node src/scripts/seed-admin.js admin@example.com Admin@123456
# Or manually in container:
docker exec -it leo-json-backend bash
node src/scripts/seed-admin.js
```

---

## Known Issues & TODOs

- [ ] Google OAuth not fully integrated (env vars not set)
- [ ] File cache lost on restart (needs persistent volume config)
- [ ] No pagination on large bins or user lists
- [ ] No full-text search on JSON content
- [ ] passwordHash field sometimes exposed (verify toJSON schema)
- [ ] Error messages could be more descriptive
- [ ] API versioning (/v2 is hardcoded, plan for v3)

---

## Statistics

| Metric | Value |
|--------|-------|
| Backend Files | 15 (routes, services, models, middleware) |
| Frontend Files | 30+ (pages, components, hooks, lib) |
| Total Lines Backend | ~500 |
| Total Lines Frontend | ~1500 |
| API Endpoints | 16+ |
| Mongoose Models | 3 |
| React Components | 25+ |
| Custom Hooks | 3 |

