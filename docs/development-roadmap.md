# Development Roadmap

**Version**: 2.0.0
**Status**: Active Development
**Last Updated**: March 24, 2026

---

## Project Timeline

```
Phase 1: Foundation (✓ COMPLETE - v2.0.0)
├─ Express backend with MongoDB
├─ Next.js 16 frontend
├─ NextAuth v5 + JWT auth
├─ JSON Bins CRUD
├─ Admin panel (users, settings)
└─ Docker Compose orchestration

Phase 2: Enhancement (→ IN PROGRESS)
├─ Full test coverage
├─ OAuth integration
├─ Performance optimization
└─ Security hardening

Phase 3: Scaling (PLANNED Q2 2026)
├─ Kubernetes deployment
├─ Redis caching layer
├─ CDN integration
└─ Analytics dashboard

Phase 4: Advanced Features (PLANNED Q3 2026)
├─ GraphQL endpoint
├─ Collaborative editing
├─ API rate limiting
└─ Advanced search
```

---

## Phase 1: Foundation (COMPLETE)

### Overview
Complete rewrite from PHP monolith (v1) to modern stack with microservices architecture.

### Completed Features

| Feature | Status | Date | Notes |
|---------|--------|------|-------|
| Express backend setup | ✓ | 2026-03-22 | Routes, middleware, error handling |
| MongoDB models | ✓ | 2026-03-22 | User, JsonBin, Setting schemas |
| Local authentication | ✓ | 2026-03-22 | Register, login, JWT tokens |
| JSON Bins CRUD | ✓ | 2026-03-23 | Create, read, update, delete with groups |
| Slug management | ✓ | 2026-03-23 | Custom slugs, unique validation, updates |
| File cache sync | ✓ | 2026-03-23 | Write-through cache for public API |
| Public API endpoint | ✓ | 2026-03-23 | GET /api/v2?target=slug (no auth) |
| Admin users panel | ✓ | 2026-03-24 | CRUD, role toggle, delete with cascade |
| Settings management | ✓ | 2026-03-24 | allowRegistration, logoUrl, siteName |
| Next.js frontend | ✓ | 2026-03-23 | Pages, layouts, routing |
| NextAuth integration | ✓ | 2026-03-23 | Credentials provider, session management |
| UI components | ✓ | 2026-03-23 | shadcn/ui, responsive design |
| TanStack Query | ✓ | 2026-03-23 | Data fetching, caching, mutations |
| Confirm dialog | ✓ | 2026-03-24 | Replace window.confirm with modal |
| Docker setup | ✓ | 2026-03-24 | Multi-stage build, Compose orchestration |
| Documentation | ✓ | 2026-03-24 | API docs, architecture, deployment guide |

### Phase 1 Metrics
- **Lines of Code**: ~2000 (backend: 500, frontend: 1500)
- **API Endpoints**: 16
- **Components**: 25+
- **Test Coverage**: 0% (planned for phase 2)
- **Performance**: <200ms avg response (local)

---

## Phase 2: Enhancement (IN PROGRESS)

### Goals
- [ ] Achieve 80%+ test coverage
- [ ] Implement Google OAuth
- [ ] Optimize bundle size & performance
- [ ] Add security headers & hardening
- [ ] Create comprehensive API documentation

### 2.1 Test Implementation (PLANNED)

**Backend Unit Tests** (25-30 tests)
```
Scope:
- binService functions (createBin, updateBin, deleteBin, etc.)
- cacheService (readCache, writeCache, deleteCache)
- Middleware (auth, requireAdmin, error handler)
- Models (validation, serialization)

Framework: Jest + Supertest
Target: >80% coverage
Timeline: 1-2 weeks
```

**Frontend Component Tests** (20-25 tests)
```
Scope:
- Pages (login, bins list, admin)
- Hooks (useBins, useUsers, useSettings)
- Components (BinEditor, ConfirmDialog, UI)

Framework: Vitest + React Testing Library
Target: >70% coverage
Timeline: 2-3 weeks
```

**Integration Tests** (10-15 tests)
```
Scope:
- Full auth flow (register → login → bins)
- Bin CRUD operations end-to-end
- Admin operations (users, settings)
- Public API access

Framework: Cypress or Playwright
Timeline: 1 week
```

**Effort**: ~2 weeks
**Owner**: TBD
**Acceptance Criteria**:
- [ ] All routes have unit tests
- [ ] All components have snapshot tests
- [ ] E2E tests pass (login, CRUD, admin)
- [ ] Coverage report: >80% backend, >70% frontend
- [ ] CI/CD pipeline runs tests automatically

### 2.2 Google OAuth Integration (PLANNED)

**Requirements**:
1. Create Google Cloud project & OAuth credentials
2. Add Google provider to NextAuth config
3. Handle user creation on OAuth sign-up
4. Link OAuth users to existing local accounts (optional)

**Tasks**:
```
1. Setup Google Cloud Console
   - Create project: leo-simple-json
   - Create OAuth 2.0 credentials (Web app)
   - Authorized redirect URIs: http://localhost:3002/api/auth/callback/google
   - Get CLIENT_ID & CLIENT_SECRET

2. Update NextAuth config (frontend/src/lib/auth.ts)
   - Already has Google provider scaffold
   - Add clientId/clientSecret from env
   - Test provider flow

3. Backend: Handle Google users (optional)
   - Add OAuth token validation (if needed)
   - Support user creation via Google

4. Frontend: Update login page
   - Add Google sign-in button
   - Test flow locally
   - Test in Docker

5. Documentation
   - Add Google OAuth setup guide
   - Update deployment instructions
```

**Effort**: 3-4 days
**Owner**: TBD
**Acceptance Criteria**:
- [ ] Google sign-in button renders on login page
- [ ] User can sign in via Google
- [ ] Session persists (JWT + NextAuth)
- [ ] User role defaults to 'user' on OAuth sign-up
- [ ] Works in Docker and production

### 2.3 Performance Optimization (PLANNED)

**Frontend Bundle**:
```
Current: ~500KB (gzipped estimate)
Target: <300KB

Strategies:
- Code splitting (dynamic imports)
- Lazy load Monaco editor (only on /bins/[slug])
- Remove unused dependencies
- Tree-shake shadcn/ui components
- Image optimization (next/image)

Estimated impact: -40% bundle size
Timeline: 3-5 days
```

**Backend Response Time**:
```
Current: 50-100ms (local)
Target: <50ms (cached), <100ms (DB)

Strategies:
- Add Redis caching layer (optional)
- MongoDB query optimization (indexes)
- Implement response compression (gzip)
- Add ETag caching headers

Timeline: 1 week
```

**Database Indexes**:
```javascript
// Ensure these are created:
db.jsonbins.createIndex({ slug: 1 }, { unique: true })
db.jsonbins.createIndex({ userId: 1 })
db.jsonbins.createIndex({ userId: 1, group: 1 })
db.users.createIndex({ email: 1 }, { unique: true })
```

**Effort**: 1-2 weeks
**Owner**: TBD
**Acceptance Criteria**:
- [ ] Bundle size <300KB (gzipped)
- [ ] LCP <2.5s, FID <100ms, CLS <0.1 (Core Web Vitals)
- [ ] Backend response time <100ms (p95)
- [ ] Cache hit rate >70% for public API

### 2.4 Security Hardening (PLANNED)

**Headers & Middleware**:
```javascript
// Add to backend/src/app.js
import helmet from 'helmet';
app.use(helmet());  // Security headers

// Content-Security-Policy
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
});

// HSTS (HTTPS Strict Transport Security)
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  next();
});
```

**CORS Hardening**:
```javascript
// Whitelist specific origin only
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**Input Validation**:
- [ ] Validate all request bodies (zod/joi)
- [ ] Sanitize HTML input (DOMPurify on frontend)
- [ ] Rate limiting on auth endpoints

**Secrets Management**:
- [ ] No hardcoded secrets in code
- [ ] Use environment variables only
- [ ] Rotate JWT_SECRET regularly (plan)
- [ ] Use AWS Secrets Manager / HashiCorp Vault in production

**Effort**: 3-5 days
**Owner**: TBD
**Acceptance Criteria**:
- [ ] All OWASP Top 10 addressed
- [ ] Security headers present (A+ on securityheaders.com)
- [ ] No console errors/warnings
- [ ] Secrets never logged
- [ ] XSS protection verified

### 2.5 API Documentation (PLANNED)

**OpenAPI/Swagger**:
```yaml
# swagger.yaml
openapi: 3.0.0
info:
  title: Leo Simple JSON API
  version: 2.0.0
  description: JSON storage and management API
paths:
  /api/v2/auth/login:
    post:
      summary: Login user
      tags: [Auth]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                password:
                  type: string
      responses:
        200:
          description: Login successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LoginResponse'
        401:
          description: Invalid credentials
```

**Options**:
1. **Swagger UI**: Generate interactive docs from OpenAPI
2. **Postman Collection**: Export for team testing
3. **AsyncAPI** (if WebSocket added): Document real-time APIs

**Effort**: 2-3 days
**Owner**: TBD
**Acceptance Criteria**:
- [ ] OpenAPI 3.0 spec complete
- [ ] Swagger UI deployed at /api/docs
- [ ] All endpoints documented with examples
- [ ] Request/response schemas defined
- [ ] Error responses documented

---

## Phase 3: Scaling (PLANNED Q2 2026)

### Goals
- [ ] Kubernetes deployment ready
- [ ] Redis caching layer
- [ ] CDN for static assets
- [ ] Monitoring & alerting
- [ ] Load testing & capacity planning

### 3.1 Kubernetes Migration

**Deliverables**:
- Helm chart for deployment
- HPA (Horizontal Pod Autoscaler) config
- Ingress with TLS
- ConfigMaps for environment variables
- Secrets for sensitive data

**Effort**: 2-3 weeks
**Timeline**: Q2 2026

### 3.2 Redis Caching

**Use Cases**:
1. Session store (NextAuth)
2. Rate limiting (IP-based)
3. JSON bin cache (alternative to files)
4. Query result caching (MongoDB)

**Effort**: 1 week
**Timeline**: Q2 2026

### 3.3 CDN Integration

**Static Assets**:
- Deploy frontend `/public` to S3 + CloudFront
- Deploy Next.js `/_next/static` to CDN

**Benefits**:
- Reduced server bandwidth
- Faster global delivery
- GZIP compression

**Effort**: 2-3 days
**Timeline**: Q2 2026

### 3.4 Monitoring & Observability

**Stack**:
- Prometheus (metrics)
- Grafana (visualization)
- ELK Stack (logs)
- Jaeger (tracing) — optional

**Dashboards**:
- API latency & throughput
- Error rate & 5xx responses
- Database query performance
- Resource usage (CPU, memory, disk)

**Alerts**:
- Error rate > 5%
- Response time > 500ms
- CPU > 80%
- MongoDB replication lag

**Effort**: 2-3 weeks
**Timeline**: Q2 2026

---

## Phase 4: Advanced Features (PLANNED Q3 2026)

### 4.1 GraphQL Endpoint

**Motivation**: Complex queries, reduce over-fetching

**Schema**:
```graphql
type Query {
  me: User
  bin(slug: String!): JsonBin
  bins(group: String): [JsonBin!]!
  settings: [Setting!]!
}

type Mutation {
  createBin(input: CreateBinInput!): JsonBin!
  updateBin(slug: String!, input: UpdateBinInput!): JsonBin!
  deleteBin(slug: String!): Boolean!
}
```

**Implementation**: Apollo Server or GraphQL Yoga
**Effort**: 2-3 weeks
**Timeline**: Q3 2026

### 4.2 Collaborative Editing (WebSocket)

**Features**:
- Real-time bin content sync
- Multi-user presence indicators
- Conflict resolution (CRDTs or operational transforms)
- Change history/audit log

**Stack**: Socket.io or Yjs + WebSocket
**Effort**: 4-6 weeks
**Timeline**: Q3-Q4 2026

### 4.3 Advanced Search

**Features**:
- Full-text search in JSON content
- Filter by group, date, visibility
- Tag/label support
- Saved searches

**Implementation**: MongoDB full-text search or Elasticsearch
**Effort**: 1-2 weeks
**Timeline**: Q3 2026

### 4.4 Rate Limiting & Quotas

**Per-User Limits**:
- 1000 requests/hour (global)
- 100 bins/user (storage)
- 5MB/bin (size limit)

**Implementation**: Redis + middleware
**Effort**: 3-4 days
**Timeline**: Q2 2026 (move up if needed)

---

## Known Issues & TODOs

### Critical
- [ ] **Google OAuth**: Needs configuration & testing
- [ ] **File cache**: Lost on restart without persistent volume
- [ ] **Error messages**: Need more descriptive client messages

### High Priority
- [ ] **Tests**: No test suite yet (Phase 2.1)
- [ ] **Logging**: Add structured logging (JSON format)
- [ ] **Rate limiting**: Prevent API abuse
- [ ] **Input validation**: Use zod/joi schemas

### Medium Priority
- [ ] **API versioning**: /v2 hardcoded, plan v3 compatibility
- [ ] **Pagination**: Large lists need pagination
- [ ] **Search**: Full-text search in bins
- [ ] **Performance**: Bundle size & response time optimization

### Low Priority
- [ ] **Dark mode toggle**: UI theme switching
- [ ] **Mobile app**: Native iOS/Android (maybe)
- [ ] **Webhooks**: Notify external systems on changes
- [ ] **Backups**: Automated backup scheduling

---

## Development Velocity

### Current (Phase 1)
- **Sprint**: 1 week
- **Team Size**: 1-2 developers
- **Velocity**: ~40 story points/sprint

### Phase 2 Target
- **Sprint**: 2 weeks
- **Team Size**: 2-3 developers
- **Velocity**: ~60 story points/sprint

### Phase 3+ Target
- **Sprint**: 2 weeks
- **Team Size**: 3-4 developers
- **Velocity**: ~80 story points/sprint

---

## Resource Allocation

| Phase | Backend | Frontend | Ops | Total |
|-------|---------|----------|-----|-------|
| Phase 1 | 40% | 50% | 10% | 100% |
| Phase 2 | 35% | 40% | 25% | 100% |
| Phase 3 | 25% | 35% | 40% | 100% |
| Phase 4 | 40% | 40% | 20% | 100% |

---

## Success Metrics

### Adoption
- [ ] 100 active users by Q2 2026
- [ ] 10k bins stored by Q2 2026
- [ ] 99.9% uptime in production

### Performance
- [ ] <100ms API response time (p95)
- [ ] <2.5s page load (LCP)
- [ ] <300KB bundle size (gzipped)

### Quality
- [ ] 80%+ test coverage
- [ ] 0 critical security vulnerabilities
- [ ] <1% error rate in production

### Developer Experience
- [ ] Setup time <15 minutes
- [ ] Documentation complete & up-to-date
- [ ] CI/CD pipeline fully automated

---

## Questions & Decisions Pending

1. **OAuth Scope**: Should we link OAuth users to existing local accounts?
2. **File Cache**: Replace with Redis for multi-instance deployments?
3. **Real-time Sync**: Is collaborative editing a priority?
4. **GraphQL**: Replace REST with GraphQL or keep both?
5. **Monetization**: Plan for SaaS or stay open-source?

