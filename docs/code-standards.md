# Code Standards & Codebase Structure

## Codebase Architecture

```
leo-simple-json/
├── backend/
│   ├── src/
│   │   ├── app.js                      # Express app setup, routes, error handler
│   │   ├── config/
│   │   │   └── db.js                   # MongoDB connection
│   │   ├── middleware/
│   │   │   ├── auth.js                 # JWT verification middleware
│   │   │   ├── error-handler.js        # Global error handler
│   │   │   └── require-admin.js        # Admin-only route guard
│   │   ├── models/
│   │   │   ├── user.js                 # User schema + serialization
│   │   │   ├── json-bin.js             # JsonBin schema
│   │   │   └── setting.js              # Settings schema
│   │   ├── routes/
│   │   │   ├── auth-routes.js          # /api/v2/auth/* endpoints
│   │   │   ├── bin-routes.js           # /api/v2/bins/* endpoints
│   │   │   ├── user-routes.js          # /api/v2/admin/users/* endpoints
│   │   │   └── setting-routes.js       # /api/v2/settings/* endpoints
│   │   ├── services/
│   │   │   ├── bin-service.js          # Bin CRUD + cache sync
│   │   │   └── cache-service.js        # Write-through file cache
│   │   └── scripts/
│   │       └── seed-admin.js           # One-time admin account creation
│   ├── Dockerfile                      # Multi-stage (removed for simplicity)
│   ├── package.json
│   └── data/                           # File cache directory (gitignored)
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx              # Root layout (fonts, metadata)
│   │   │   ├── page.tsx                # Home/redirect
│   │   │   ├── globals.css             # Tailwind + global styles
│   │   │   ├── (auth)/
│   │   │   │   └── login/page.tsx      # Login page
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx          # Protected layout (nav, sidebar)
│   │   │   │   ├── bins/
│   │   │   │   │   ├── page.tsx        # Bins list
│   │   │   │   │   ├── new/page.tsx    # Create bin
│   │   │   │   │   └── [slug]/page.tsx # Edit bin
│   │   │   │   └── admin/
│   │   │   │       ├── users/page.tsx  # User management
│   │   │   │       └── settings/page.tsx # Settings editor
│   │   │   └── api/auth/[...nextauth]/route.ts # NextAuth handler
│   │   ├── components/
│   │   │   ├── bin-editor.tsx          # Monaco editor + JSON validation
│   │   │   ├── confirm-dialog.tsx      # Reusable confirm modal
│   │   │   ├── providers.tsx           # NextAuth + QueryClient setup
│   │   │   └── ui/                     # shadcn/ui components
│   │   ├── hooks/
│   │   │   ├── use-bins.ts             # Bin CRUD queries + mutations
│   │   │   ├── use-users.ts            # Admin user management
│   │   │   └── use-settings.ts         # Settings CRUD
│   │   ├── lib/
│   │   │   ├── auth.ts                 # NextAuth config (providers, callbacks)
│   │   │   ├── api-client.ts           # Fetch wrapper with token injection
│   │   │   └── utils.ts                # cn() + utility functions
│   │   └── types/
│   │       └── index.ts                # TypeScript interfaces
│   ├── Dockerfile                      # Multi-stage build (standalone)
│   ├── next.config.ts
│   ├── package.json
│   └── public/                         # Static assets
│
├── docker-compose.yml                  # Services orchestration
├── README.md                           # Old v1 documentation
├── obsolete-php/                       # V1 PHP codebase (archived)
└── docs/                               # This documentation
```

---

## Naming Conventions

### Backend (Node.js/Express)

| Type | Pattern | Example |
|------|---------|---------|
| Files | kebab-case.js | `bin-routes.js`, `cache-service.js` |
| Directories | kebab-case | `middleware/`, `services/` |
| Functions | camelCase | `createBin()`, `signToken()` |
| Constants | UPPER_SNAKE_CASE | `JWT_SECRET`, `SLUG_RE` |
| Classes/Models | PascalCase | `User`, `JsonBin` |
| Exports | Named + default | Both patterns used |

### Frontend (React/Next.js)

| Type | Pattern | Example |
|------|---------|---------|
| Files | kebab-case.tsx/.ts | `bin-editor.tsx`, `use-bins.ts` |
| Components | PascalCase | `BinEditor`, `ConfirmDialog` |
| Hooks | camelCase (use*) | `useBins()`, `useSettings()` |
| Functions | camelCase | `fetchBins()`, `formatDate()` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL`, `VALID_ROLES` |
| Types | PascalCase | `User`, `CreateBinInput` |

### Database

| Type | Pattern |
|------|---------|
| Collections | camelCase |
| Fields | camelCase |
| IDs | `_id` (MongoDB ObjectId) |
| Timestamps | `createdAt`, `updatedAt` |

---

## Code Patterns & Best Practices

### Backend

#### Error Handling
All errors use custom `status` property (caught by `errorHandler` middleware):
```javascript
// ✓ Correct
throw Object.assign(new Error('Slug already taken'), { status: 409 });

// ✓ Also correct
const err = new Error('Not found');
err.status = 404;
throw err;

// ✗ Avoid
throw new Error('Failed');  // No status = 500
```

#### Middleware Stack
Routes are protected in order:
1. **Authentication** (`requireAuth`): Extracts JWT, sets `req.user`
2. **Authorization** (`requireAdmin`): Checks `req.user.role === 'admin'`
3. **Route Handler**: Implements business logic

```javascript
router.use(requireAuth);          // All routes below need auth
router.use(requireAdmin);         // Plus admin check
router.get('/', async (req, res) => {
  // req.user.id, req.user.role guaranteed
});
```

#### Service Layer
Routes delegate to service functions, services handle DB + cache:
```javascript
// Route
router.post('/', async (req, res) => {
  const bin = await binService.createBin(req.user.id, req.body);
  res.status(201).json({ success: true, data: bin });
});

// Service
export async function createBin(userId, { name, group, content, isPublic, slug }) {
  // Validation
  if (slug && !SLUG_RE.test(slug)) throw error;
  if (slug) {
    const taken = await JsonBin.findOne({ slug });
    if (taken) throw error;
  }
  // DB write
  const bin = await JsonBin.create({ userId, name, ... });
  // Cache write
  await writeCache(bin.slug, content);
  return bin;
}
```

#### Slug Validation
```javascript
const SLUG_RE = /^[a-zA-Z0-9_-]{3,50}$/;

if (slug && !SLUG_RE.test(slug)) {
  return res.status(400).json({
    success: false,
    msg: 'slug: 3-50 chars, letters/numbers/- and _ only'
  });
}
```

#### Write-Through Cache
Every content write updates both DB + file system:
```javascript
const bin = await JsonBin.create({ ... });
await writeCache(bin.slug, content);  // File sync

// On slug change: delete old, write new
await deleteCache(oldSlug);
await writeCache(newSlug, content);
```

### Frontend

#### API Client
All API calls use `api-client.ts` (auto-injects token):
```typescript
// In hook/component
const { data } = await api('GET', '/api/v2/bins?group=default');
await api('POST', '/api/v2/bins', { name, content });
```

#### TanStack Query Pattern
```typescript
// In hook
export function useBins() {
  const query = useQuery({
    queryKey: ['bins'],
    queryFn: () => api('GET', '/api/v2/bins'),
  });
  const mutation = useMutation({
    mutationFn: (data) => api('POST', '/api/v2/bins', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bins'] }),
  });
  return { ...query, ...mutation };
}

// In component
const { data: bins, isPending, mutateAsync } = useBins();
```

#### ConfirmDialog Usage
Replaces all native `window.confirm()` calls:
```typescript
import { ConfirmDialog, useConfirm } from '@/components/confirm-dialog';

const { confirm } = useConfirm();

const handleDelete = async () => {
  if (await confirm('Delete this bin?')) {
    await deleteBin(id);
  }
};

// In layout or root component
<ConfirmDialog />
```

#### Component Structure
```typescript
'use client';  // Client component marker

import { useState } from 'react';
import { useBins } from '@/hooks/use-bins';
import { Button } from '@/components/ui/button';

export function BinList() {
  const { data } = useBins();

  return (
    <div>
      {data?.map(bin => (
        <div key={bin._id}>{bin.name}</div>
      ))}
    </div>
  );
}
```

#### Auth Pattern
```typescript
// Get session
import { auth } from '@/lib/auth';
const session = await auth();
if (!session?.user.role === 'admin') unauthorized();

// In client component
import { useSession } from 'next-auth/react';
const { data: session } = useSession();
session?.user.backendToken  // Include in API calls
```

---

## Type Definitions

### Shared Types (frontend/src/types/index.ts)
All API request/response types defined once, imported everywhere:

```typescript
export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

export interface JsonBin {
  _id: string;
  userId: string;
  name: string;
  slug: string;
  group: string;
  content: unknown;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBinInput {
  name: string;
  slug?: string;
  group?: string;
  content?: unknown;
  isPublic?: boolean;
}
```

---

## Testing Strategy

### Backend
- **Unit**: Service functions (cache, bin-service)
- **Integration**: Route handlers + DB operations
- **Setup**: Jest or Mocha with mocked MongoDB
- **Coverage**: >80% target

### Frontend
- **Component**: React Testing Library (shadcn, custom components)
- **Integration**: Full user flows (login, bin CRUD)
- **Setup**: Vitest with MSW for API mocking
- **Coverage**: >70% target

---

## Security Standards

### Backend
- **JWT**: Signed with `JWT_SECRET`, 7-day expiry
- **Hashing**: bcryptjs (12 rounds) for passwords
- **CORS**: Restrict to `FRONTEND_URL`
- **Validation**: Slug regex, content type checks
- **Errors**: No stack traces in responses

### Frontend
- **NextAuth**: Secure session management
- **HTTPS Only**: Set `secure: true` in production
- **Token Storage**: Encrypted in NextAuth session cookie
- **API**: All requests authenticated except `/api/v2/settings/public`

---

## File Size Management

**Target: Keep files under 200 lines for optimal context**

### Current Status
- `app.js`: 60 lines ✓
- `bin-service.js`: 66 lines ✓
- `bin-routes.js`: 64 lines ✓
- Frontend routes: <80 lines each ✓

### Splitting Rules
If a file exceeds 200 lines:
1. Extract utilities into `lib/` or `services/`
2. Create multiple route files (e.g., `user-routes.js`, `bin-routes.js`)
3. Separate concerns (models, middleware, routes)

---

## Dependencies Management

### Backend
- Minimal dependencies (express, cors, mongoose, jwt, bcrypt)
- No heavy frameworks beyond Express
- Version-locked in package.json

### Frontend
- Use shadcn/ui for all UI components
- TanStack Query for data fetching (not Redux)
- NextAuth v5 for authentication
- No duplicate state management tools

### Updates
- Regular npm audit for security
- Test after major version bumps
- Lock package versions in CI/CD

---

## Git Workflow

### Commit Messages
Use conventional commits:
```
feat: add slug update with cache invalidation
fix: prevent duplicate slug registration
docs: update API endpoints documentation
refactor: extract cache logic to service
test: add bin CRUD unit tests
```

### Branches
- `main`: Production-ready code
- `feat/feature-name`: Feature branches
- `fix/bug-name`: Bug fix branches

### PR Requirements
- [ ] Code changes tested locally
- [ ] No console errors in dev
- [ ] Commit messages descriptive
- [ ] Related docs updated

