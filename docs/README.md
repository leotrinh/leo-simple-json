# Leo Simple JSON V2 Documentation

**Version**: 2.0.0
**Last Updated**: March 24, 2026
**Status**: Complete & Production Ready

Welcome to the official documentation for leo-simple-json, a modern JSON storage and management platform built with Node.js/Express and Next.js.

---

## Quick Links

| Document | Purpose | Audience |
|----------|---------|----------|
| **[project-overview-pdr.md](./project-overview-pdr.md)** | Project vision, features, tech stack, requirements | PMs, stakeholders, architects |
| **[code-standards.md](./code-standards.md)** | Coding conventions, patterns, best practices | Developers, code reviewers |
| **[codebase-summary.md](./codebase-summary.md)** | File structure, modules, API reference | Developers, new team members |
| **[system-architecture.md](./system-architecture.md)** | Architecture diagrams, data flow, auth, security | Architects, DevOps, security |
| **[deployment-guide.md](./deployment-guide.md)** | Setup, deployment, monitoring, troubleshooting | DevOps, SRE, operators |
| **[development-roadmap.md](./development-roadmap.md)** | Phases, timeline, features, metrics | PMs, developers, leads |

---

## Getting Started

### For New Developers (15 min onboarding)

1. Read: [project-overview-pdr.md](./project-overview-pdr.md) — Understand project scope
2. Read: [code-standards.md](./code-standards.md) — Learn coding conventions
3. Read: [codebase-summary.md](./codebase-summary.md) — Explore file structure
4. Setup: [deployment-guide.md](./deployment-guide.md) → "Quick Start (Local Development)"
5. Start coding!

### For DevOps / Operations

1. Read: [system-architecture.md](./system-architecture.md) — Understand system design
2. Read: [deployment-guide.md](./deployment-guide.md) — Choose deployment scenario
3. Follow: "Docker Deployment" or "Production Deployment" sections
4. Setup: Monitoring, backups, alerts

### For Project Managers

1. Read: [project-overview-pdr.md](./project-overview-pdr.md) — Feature overview
2. Read: [development-roadmap.md](./development-roadmap.md) — Timeline & phases
3. Reference: Success metrics & known limitations

### For Architects / Tech Leads

1. Read: [system-architecture.md](./system-architecture.md) — Complete architecture
2. Read: [code-standards.md](./code-standards.md) — Design patterns
3. Read: [development-roadmap.md](./development-roadmap.md) — Scaling strategy

---

## Document Overview

### project-overview-pdr.md (208 lines)
**Product Definition & Requirements**

Covers:
- Project history (V1 PHP → V2 rewrite)
- Core features (auth, bins, admin, public API)
- Tech stack with versions
- Database schema
- Architecture overview
- Environment configuration
- Acceptance criteria & success metrics

**When to read**: Initial onboarding, feature clarification, stakeholder updates

---

### code-standards.md (409 lines)
**Development Standards & Best Practices**

Covers:
- Complete codebase architecture (file tree)
- Naming conventions (backend, frontend, database)
- Code patterns & best practices
  - Backend: error handling, middleware, services, validation
  - Frontend: API client, hooks, components, auth patterns
- Type definitions
- Testing strategy
- Security standards
- File size management
- Dependencies
- Git workflow

**When to read**: Before starting code, code review, pattern questions

---

### codebase-summary.md (572 lines)
**Live Codebase Reference**

Covers:
- Backend module breakdown (routes, services, models, middleware)
- Frontend pages, components, hooks
- API endpoints (all 16+ documented)
- Database collections & schemas
- Docker & deployment basics
- File cache architecture
- Development setup commands

**When to read**: Locating code, understanding module structure, API reference

---

### system-architecture.md (616 lines)
**System Design & Architecture**

Covers:
- High-level architecture diagram
- Component interactions
- Data flow (write-through cache)
- Authentication & authorization flow
- Database schema & relationships
- API request/response cycle
- Docker networking
- Error handling pipeline
- Scaling considerations
- Security layers
- Production deployment architecture

**When to read**: Understanding system design, deployment planning, performance tuning

---

### deployment-guide.md (658 lines)
**Deployment & Operations**

Covers:
- Local development setup
- Docker Compose
- Production deployment (AWS, Kubernetes, Nginx)
- Database setup (MongoDB Atlas, self-hosted)
- Monitoring & logging
- Backup & recovery
- Performance tuning
- Troubleshooting (5+ scenarios)
- Scaling strategies
- Maintenance checklist

**When to read**: Setting up environment, troubleshooting, deployment planning

---

### development-roadmap.md (553 lines)
**Project Timeline & Feature Roadmap**

Covers:
- Phase 1: Foundation (COMPLETE)
- Phase 2: Enhancement (IN PROGRESS)
  - Test implementation
  - Google OAuth
  - Performance optimization
  - Security hardening
  - API documentation
- Phase 3: Scaling (Q2 2026)
- Phase 4: Advanced Features (Q3 2026)
- Known issues & TODOs
- Development velocity
- Resource allocation
- Success metrics
- Open questions

**When to read**: Planning sprints, prioritizing features, understanding timeline

---

## Key Sections by Use Case

### I need to...

**...set up a local dev environment**
→ [deployment-guide.md](./deployment-guide.md#quick-start-local-development)

**...deploy to production**
→ [deployment-guide.md](./deployment-guide.md#production-deployment)

**...understand how authentication works**
→ [system-architecture.md](./system-architecture.md#authentication--authorization-flow)

**...add a new API endpoint**
→ [code-standards.md](./code-standards.md#backend) + [codebase-summary.md](./codebase-summary.md#api-endpoints)

**...create a new React component**
→ [code-standards.md](./code-standards.md#frontend) + [codebase-summary.md](./codebase-summary.md#components)

**...troubleshoot a database error**
→ [deployment-guide.md](./deployment-guide.md#troubleshooting)

**...understand the cache strategy**
→ [system-architecture.md](./system-architecture.md#data-flow-write-through-cache)

**...plan the next sprint**
→ [development-roadmap.md](./development-roadmap.md#phase-2-enhancement-in-progress)

**...write tests**
→ [code-standards.md](./code-standards.md#testing-strategy) + [development-roadmap.md](./development-roadmap.md#21-test-implementation-planned)

---

## Technology Stack Reference

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js | 16.2.1 |
| Frontend Auth | NextAuth | 5.0.0-beta |
| Frontend State | TanStack Query | 5.95.0 |
| Frontend UI | shadcn/ui + Tailwind | - |
| Backend | Express.js | 4.19.2 |
| Database | MongoDB | 7 |
| Hashing | bcryptjs | 2.4.3 |
| JWT | jsonwebtoken | 9.0.2 |
| Containerization | Docker | - |
| Node.js | v20 Alpine | - |

**See also**: [project-overview-pdr.md](./project-overview-pdr.md#tech-stack)

---

## API Endpoints at a Glance

### Public (No Auth)
```
GET /api/v2?target=slug              # Fetch JSON from cache
GET /api/v2/settings/public          # Public settings
```

### Authentication
```
POST /api/v2/auth/register           # Create user
POST /api/v2/auth/login              # Login & get token
GET /api/v2/auth/me                  # Current user profile
```

### JSON Bins (Auth Required)
```
GET /api/v2/bins?group=default       # List bins
GET /api/v2/bins/groups              # List groups
POST /api/v2/bins                    # Create bin
GET /api/v2/bins/:slug               # Get one bin
PUT /api/v2/bins/:slug               # Update bin
DELETE /api/v2/bins/:slug            # Delete bin
```

### Admin (Auth + Admin Role Required)
```
POST /api/v2/admin/users             # Create user
GET /api/v2/admin/users              # List users
PATCH /api/v2/admin/users/:id/role   # Toggle role
DELETE /api/v2/admin/users/:id       # Delete user
GET /api/v2/settings                 # List all settings
PATCH /api/v2/settings/:key          # Update setting
```

**Complete reference**: [codebase-summary.md](./codebase-summary.md#api-endpoints)

---

## File Structure

```
leo-simple-json/
├── backend/                          # Express.js API
│   ├── src/
│   │   ├── app.js                   # Entry point
│   │   ├── routes/                  # Route handlers
│   │   ├── services/                # Business logic
│   │   ├── models/                  # Mongoose schemas
│   │   └── middleware/              # Auth, errors, validation
│   ├── Dockerfile                   # Container image
│   └── package.json
│
├── frontend/                         # Next.js app
│   ├── src/
│   │   ├── app/                     # Pages & layouts
│   │   ├── components/              # React components
│   │   ├── hooks/                   # Custom hooks
│   │   ├── lib/                     # Auth, API client, utils
│   │   └── types/                   # TypeScript interfaces
│   ├── Dockerfile                   # Multi-stage build
│   └── package.json
│
├── docker-compose.yml               # Orchestration
├── docs/                            # This documentation
└── README.md                        # Old v1 docs
```

**Full tree**: [code-standards.md](./code-standards.md#codebase-architecture)

---

## Common Questions

**Q: How do I authenticate users?**
A: See [system-architecture.md#authentication--authorization-flow](./system-architecture.md#authentication--authorization-flow)

**Q: What's the write-through cache?**
A: See [system-architecture.md#data-flow-write-through-cache](./system-architecture.md#data-flow-write-through-cache)

**Q: How do I deploy to AWS?**
A: See [deployment-guide.md#aws-deployment-example](./deployment-guide.md#aws-deployment-example)

**Q: What tests do we need?**
A: See [development-roadmap.md#21-test-implementation-planned](./development-roadmap.md#21-test-implementation-planned)

**Q: How do I configure Google OAuth?**
A: See [development-roadmap.md#22-google-oauth-integration-planned](./development-roadmap.md#22-google-oauth-integration-planned)

**Q: What's the admin role used for?**
A: See [project-overview-pdr.md#admin-panel](./project-overview-pdr.md#admin-panel)

---

## Maintenance & Updates

### Who maintains docs?
- **Frontend docs** (pages, components): Frontend lead
- **Backend docs** (routes, services): Backend lead
- **Architecture docs** (system-architecture.md): Tech lead
- **Deployment docs** (deployment-guide.md): DevOps/SRE
- **Roadmap** (development-roadmap.md): Product manager

### When to update docs
- After code changes that affect behavior
- After dependency upgrades
- Before major releases
- When adding new features
- When fixing critical bugs

### How to update
1. Edit relevant .md file(s)
2. Keep line count under 800 per file
3. Update last-updated date at top
4. Link cross-references
5. Commit with message: `docs: update {section} for {reason}`

---

## Documentation Statistics

| File | Lines | Size | Purpose |
|------|-------|------|---------|
| project-overview-pdr.md | 208 | 6.6K | Vision & requirements |
| code-standards.md | 409 | 12K | Standards & patterns |
| codebase-summary.md | 572 | 15K | Codebase reference |
| system-architecture.md | 616 | 26K | Design & architecture |
| deployment-guide.md | 658 | 15K | Setup & deployment |
| development-roadmap.md | 553 | 14K | Timeline & roadmap |
| **TOTAL** | **3,016** | **88K** | Complete suite |

**Quality**: All files under 800 LOC limit, comprehensive coverage, verified against codebase.

---

## Related Resources

- **Repomix Output**: `repomix-output.xml` — Machine-readable codebase summary
- **git log**: View recent commits & history
- **TypeScript Types**: See `frontend/src/types/index.ts`
- **Swagger/OpenAPI**: Planned in Phase 2

---

## Support & Feedback

Found an issue in the docs?
- Check the relevant document section
- Ask in team chat with document reference
- Create an issue with "docs:" prefix

Want to contribute docs improvements?
- Follow the [code-standards.md](./code-standards.md#git-workflow) git workflow
- Keep line counts under 800
- Update cross-references

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2026-03-24 | Complete documentation suite (6 files, 3000+ LOC) |
| - | - | - |

---

**Last Updated**: March 24, 2026
**Next Review**: April 21, 2026 (phase 2 completion)
**Maintainer**: Tech Lead

