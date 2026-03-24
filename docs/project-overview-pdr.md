# Leo Simple JSON - Project Overview & PDR

## Project Overview

**leo-simple-json** is a modern web application for storing, managing, and sharing JSON data with a focus on developer experience and ease of use.

V2 represents a complete rewrite from PHP monolith to a containerized microservices architecture with:
- **Backend**: Node.js/Express with MongoDB persistence + file-based write-through cache
- **Frontend**: Next.js 16 with NextAuth v5, TanStack Query v5, shadcn/ui components
- **Auth**: JWT + NextAuth credentials provider + Google OAuth (planned)
- **Admin Panel**: User & settings management via role-based access control
- **Public API**: Read-only JSON access (no auth required) for dynamic frontends

---

## Core Features

### User Management
- **Local Auth**: Email/password registration & login with bcrypt hashing
- **OAuth**: Google sign-in provider (configuration required)
- **Roles**: Admin (manage users, settings) | User (create/edit bins)
- **CRUD**: Create, read, update, delete users (admin only)
- **JWT**: 7-day expiring tokens, persisted in NextAuth session

### JSON Bins (Data Storage)
- **CRUD**: Create, read, update, delete JSON documents
- **Custom Slugs**: Unique, regex-validated (3-50 chars, alphanumeric + `-` and `_`)
- **Slug Updates**: Change slug with uniqueness check + cache invalidation
- **Groups**: Organize bins by group (e.g., `default`, `api`, `configs`)
- **Public/Private**: Control bin visibility (public bins readable via public API)
- **Timestamps**: `createdAt`, `updatedAt` auto-managed by MongoDB
- **Content**: Store arbitrary JSON (validated on write)

### Admin Panel
- **Settings**: Logo URL, site name, registration toggle
- **User List**: View all users with creation date, email, role
- **User Editor**: Create new users, toggle admin role, delete users
- **Settings Editor**: Edit public-facing settings (allowRegistration, logoUrl, siteName)

### Public API
- **Read**: `GET /api/v2?target=slug-name` — fetch public JSON (no auth)
- **Response**: File-cached, DB-independent (write-through on updates)
- **Use Case**: Dynamic UI rendering, external integrations, public dashboards

### Deployment
- **Docker Compose**: MongoDB + Backend + Frontend orchestration
- **Multi-stage Build**: Frontend runs in standalone Next.js mode
- **Networking**: Internal BACKEND_URL (Docker) vs public NEXT_PUBLIC_API_URL
- **Volumes**: Persistent bin cache + MongoDB data

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Next.js | 16.2.1 |
| **UI Framework** | React | 19.2.4 |
| **Auth** | NextAuth | 5.0.0-beta |
| **State** | TanStack Query | 5.95.0 |
| **Components** | shadcn/ui | - |
| **Styling** | Tailwind CSS | 4 |
| **Editor** | Monaco | 4.7.0 |
| **Backend** | Express.js | 4.19.2 |
| **Database** | MongoDB | 7 |
| **Auth Lib** | jsonwebtoken | 9.0.2 |
| **Hashing** | bcryptjs | 2.4.3 |
| **Container** | Docker | - |
| **Node.js** | v20 Alpine | - |

---

## Architecture Highlights

### Backend (Express.js)
- **Routes**: Auth, Bins (CRUD), Admin Users, Settings
- **Middleware**: JWT auth, admin-only protection, error handler
- **Services**: BinService (DB + cache ops), CacheService (write-through file sync)
- **Models**: User, JsonBin, Setting (Mongoose schemas)

### Frontend (Next.js)
- **Pages**: Login, Dashboard (bins list/editor), Admin (users, settings)
- **Hooks**: `use-bins`, `use-users`, `use-settings` (TanStack Query)
- **Components**: BinEditor (Monaco), ConfirmDialog (shared), UI lib
- **Auth**: NextAuth handler + Credentials + Google provider

### Caching Strategy
- **Write-Through**: On create/update, write to DB + file cache (`.data/` in backend)
- **Public Endpoint**: Reads from file cache, avoiding DB load
- **Invalidation**: Delete old file on slug change, write new file

---

## Database Schema

### User
```
{
  email: String (unique, lowercase),
  name: String,
  picture: String (optional, from OAuth),
  provider: 'local' | 'google',
  passwordHash: String (bcrypt, local only),
  role: 'admin' | 'user',
  createdAt: Date,
  updatedAt: Date
}
```

### JsonBin
```
{
  userId: ObjectId (ref User),
  name: String,
  slug: String (unique),
  group: String (default: 'default'),
  content: Object (any valid JSON),
  isPublic: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Setting
```
{
  key: String (unique),
  value: Any,
  createdAt?: Date,
  updatedAt?: Date
}
```

---

## Environment Configuration

### Backend (.env)
```
PORT=3001
MONGO_URI=mongodb://root:root123@mongodb:27017/leo_json?authSource=admin
JWT_SECRET=<32+ chars for token signing>
FRONTEND_URL=http://localhost:3002
GOOGLE_CLIENT_ID=<optional Google OAuth>
GOOGLE_CLIENT_SECRET=<optional Google OAuth>
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
AUTH_SECRET=<32+ chars for NextAuth session encryption>
AUTH_URL=http://localhost:3002
BACKEND_URL=http://leo-json-backend:3001 (Docker internal only)
AUTH_TRUST_HOST=true
GOOGLE_CLIENT_ID=<optional Google OAuth>
GOOGLE_CLIENT_SECRET=<optional Google OAuth>
```

---

## Acceptance Criteria

- [ ] Backend starts without errors, connects to MongoDB
- [ ] Frontend builds & runs in Docker standalone mode
- [ ] Users can register (if enabled) or login with local credentials
- [ ] Users can create/edit/delete JSON bins with custom slugs
- [ ] Admin users can manage system settings & user accounts
- [ ] Public API endpoint returns correct cached JSON (no auth)
- [ ] File cache stays in sync with database (write-through)
- [ ] Slug uniqueness enforced, updates invalidate old cache
- [ ] Docker Compose orchestrates all services correctly
- [ ] NextAuth persists session & user role in token

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| API Response Time | <100ms (cached) | TBD |
| Auth Latency | <200ms | TBD |
| Bin CRUD Coverage | 100% | 100% |
| Unit Test Coverage | >80% | TBD |
| Security Headers | All present | TBD |
| Mobile Responsive | iOS/Android | TBD |

---

## Known Limitations

1. **Google OAuth**: Requires client ID/secret configuration
2. **File Cache**: Lost on container restart (unless volume persisted)
3. **Slug Validation**: 3-50 chars only (no unicode support)
4. **Public Bins**: No pagination or filtering on public API
5. **Scalability**: Single MongoDB instance (no replication)

---

## Next Phase

- [ ] OAuth implementation & testing
- [ ] Full test suite (unit + integration)
- [ ] Deployment guide (AWS/GCP/Vercel)
- [ ] Analytics & monitoring setup
- [ ] API versioning strategy for breaking changes
- [ ] GraphQL alternative endpoint
- [ ] Collaborative editing (WebSocket)

