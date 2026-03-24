# JSON Manager V2

Store, manage and serve JSON data via public URLs. Built with MongoDB + Express.js backend and Next.js frontend.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind v4, shadcn/ui, NextAuth v5, TanStack Query v5, Monaco Editor |
| Backend | Node.js ESM, Express.js, Mongoose, JWT, bcryptjs, nanoid |
| Database | MongoDB 7 |
| Cache | Write-through file cache (`backend/data/{slug}.json`) — public reads skip DB entirely |
| Auth | JWT (local) + Google OAuth (scaffold) |

## Quick Start

### Prerequisites
- Docker + Docker Compose
- Node.js 20+ (for local dev only)

### Run with Docker

```bash
# Copy and configure env files
cp backend/.env.sample backend/.env
cp frontend/.env.sample frontend/.env.local

# Edit env files with your secrets, then:
docker compose up -d
```

- Frontend: http://localhost:3002
- Backend API: http://localhost:3001

### Environment Variables

**`backend/.env`**
```env
PORT=3001
MONGO_URI=mongodb://root:root123@mongodb:27017/leo_json?authSource=admin
JWT_SECRET=change_me_to_a_32_char_min_secret_key
FRONTEND_URL=http://localhost:3002
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

**`frontend/.env.local`**
```env
AUTH_SECRET=change_me_to_random_32_char_string
AUTH_URL=http://localhost:3002
AUTH_TRUST_HOST=true
NEXT_PUBLIC_API_URL=http://localhost:3001
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## Seed Admin Account

Run once after first deploy to create an admin user:

```bash
# Usage: node src/scripts/seed-admin.js <email> <password>
cd backend
node src/scripts/seed-admin.js tinhtd.info@gmail.com YourNewPassword
```

Re-running is safe — promotes existing user to admin if already registered.

## Public API

Public endpoint — no auth required, reads from file cache (zero DB hit):

```
GET /api/v2?target={slug}
```

Example:
```bash
curl https://yourdomain.com/api/v2?target=my-config
```

## Custom Slug

When creating a bin, you can set a custom slug instead of the auto-generated one:
- 3–50 characters
- Letters, numbers, `-` and `_` only
- Must be globally unique

## Production (Nginx)

After deploying with Docker, point nginx to the containers:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Rebuild frontend with your public domain so `NEXT_PUBLIC_API_URL` is baked in:

```bash
NEXT_PUBLIC_API_URL=https://yourdomain.com docker compose build frontend
docker compose up -d frontend
```

## Roles

| Role | Permissions |
|------|------------|
| `user` | Manage own bins (CRUD), view public bins |
| `admin` | All user permissions + manage all users |

## Author

- [@leotrinh](https://github.com/leotrinh)
