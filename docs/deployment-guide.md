# Deployment Guide

**Version**: 2.0.0
**Last Updated**: March 24, 2026

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- Docker Desktop
- npm or yarn

### Setup

```bash
# Clone and navigate to project root
cd leo-simple-json/.claude/worktrees/vigilant-sammet

# Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Create .env files
cp backend/.env.sample backend/.env
cp frontend/.env.local.sample frontend/.env.local

# Start Docker services
docker-compose up -d

# Wait for MongoDB to be ready (~10s)
sleep 10

# Seed admin account
docker exec leo-json-backend node src/scripts/seed-admin.js admin@example.com Admin@123456

# Access application
# Frontend: http://localhost:3002
# Backend: http://localhost:3001
# MongoDB: localhost:27017
```

### Local Development (Hot Reload)

**Backend** (Terminal 1):
```bash
cd backend
npm run dev
# Watches src/ for changes, restarts on edit
```

**Frontend** (Terminal 2):
```bash
cd frontend
npm run dev
# Starts on http://localhost:3000 (auto-reload)
```

**MongoDB** (Terminal 3 — or Docker):
```bash
docker-compose up mongodb
# Or use existing compose instance
```

### First Login

1. Navigate to http://localhost:3002/login
2. Email: `admin@example.com`
3. Password: `Admin@123456`
4. You're logged in as admin

---

## Docker Deployment

### Building Images

**Backend**
```bash
cd backend
docker build -t leo-json-backend:2.0.0 .
# Or via compose: docker-compose build backend
```

**Frontend**
```bash
cd frontend
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com \
  -t leo-json-frontend:2.0.0 .
# Or via compose: docker-compose build frontend
```

### Running with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

### Environment Variables for Compose

Create `.env` file in project root:

```bash
# Backend
JWT_SECRET=your-32-char-random-string-for-jwt-signing
FRONTEND_URL=http://localhost:3002

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
AUTH_SECRET=your-32-char-random-string-for-auth
AUTH_URL=http://localhost:3002

# Optional: Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Volumes & Persistence

```yaml
volumes:
  mongo_data:      # MongoDB data → host /var/lib/docker/volumes/
  bin_cache:       # File cache → backend/data/

# To use host paths instead:
# volumes:
#   - ./mongo-data:/data/db
#   - ./backend/data:/app/data
```

---

## Production Deployment

### Environment Setup

**Backend .env**
```
PORT=3001
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/leo_json
JWT_SECRET=<generate: openssl rand -hex 32>
FRONTEND_URL=https://yourdomain.com
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
NODE_ENV=production
```

**Frontend .env.production**
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
AUTH_SECRET=<generate: openssl rand -hex 32>
AUTH_URL=https://yourdomain.com
BACKEND_URL=<internal service URL — see below>
AUTH_TRUST_HOST=true
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
```

### AWS Deployment Example

#### 1. Prepare Images (ECR)

```bash
# Create ECR repositories
aws ecr create-repository --repository-name leo-json-backend
aws ecr create-repository --repository-name leo-json-frontend

# Build and push
aws ecr get-login-password --region us-east-1 | docker login \
  --username AWS --password-stdin {account}.dkr.ecr.us-east-1.amazonaws.com

docker build -t {account}.dkr.ecr.us-east-1.amazonaws.com/leo-json-backend:2.0.0 backend/
docker push {account}.dkr.ecr.us-east-1.amazonaws.com/leo-json-backend:2.0.0

# Repeat for frontend with NEXT_PUBLIC_API_URL set
```

#### 2. RDS / MongoDB Atlas

Use managed MongoDB (Atlas recommended):
```
mongodb+srv://username:password@cluster0.mongodb.net/leo_json?retryWrites=true
```

#### 3. ECS / App Runner

**ECS Fargate**:
- Task definition for backend (3001)
- Task definition for frontend (3000)
- Application Load Balancer (ALB)
- Auto Scaling Group

**App Runner** (simpler):
- Push image to ECR
- Create App Runner service
- Attach custom domain
- Secrets Manager for env vars

#### 4. CloudFront + S3 (Static Assets)

```bash
# Upload Next.js public/ to S3
aws s3 sync frontend/public/ s3://leo-json-assets/public/

# Create CloudFront distribution pointing to S3
# Attach to yourdomain.com
```

#### 5. SSL Certificate

```bash
# Use ACM for HTTPS
aws acm request-certificate --domain-name yourdomain.com
# Approve DNS validation
# Attach to ALB/App Runner
```

### Kubernetes Deployment (GKE Example)

```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: leo-json-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: leo-json-backend
  template:
    metadata:
      labels:
        app: leo-json-backend
    spec:
      containers:
      - name: backend
        image: gcr.io/project-id/leo-json-backend:2.0.0
        ports:
        - containerPort: 3001
        env:
        - name: MONGO_URI
          valueFrom:
            secretKeyRef:
              name: leo-json-secrets
              key: mongo-uri
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: leo-json-secrets
              key: jwt-secret
        resources:
          requests:
            cpu: 100m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /healthz
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 10

---
apiVersion: v1
kind: Service
metadata:
  name: leo-json-backend
spec:
  selector:
    app: leo-json-backend
  ports:
  - protocol: TCP
    port: 3001
    targetPort: 3001
  type: ClusterIP

---
# frontend-deployment.yaml (similar pattern)
# ingress.yaml for routing traffic
```

### Nginx Reverse Proxy (Production Best Practice)

```nginx
# /etc/nginx/sites-available/leo-json

upstream backend {
    server leo-json-backend:3001;
}

upstream frontend {
    server leo-json-frontend:3000;
}

server {
    listen 80;
    server_name yourdomain.com api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files (cached)
    location /_next/static/ {
        proxy_pass http://frontend;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
    }
}
```

---

## Database Setup

### MongoDB Atlas (Recommended)

1. Create cluster: https://www.mongodb.com/cloud/atlas
2. Configure IP whitelist or allow all (0.0.0.0/0)
3. Create database user
4. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/leo_json`
5. Use in `MONGO_URI`

### MongoDB Self-Hosted

```bash
# Docker
docker run -d \
  --name leo-json-mongo \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=root123 \
  -e MONGO_INITDB_DATABASE=leo_json \
  -v mongo_data:/data/db \
  -p 27017:27017 \
  mongo:7

# Connection string
MONGO_URI=mongodb://root:root123@localhost:27017/leo_json?authSource=admin
```

### Seeding Admin Account

**Local (Docker)**:
```bash
docker exec leo-json-backend \
  node src/scripts/seed-admin.js admin@example.com MySecurePassword123
```

**Remote (kubectl/SSH)**:
```bash
# Via SSH to server
ssh user@server
docker exec leo-json-backend \
  node src/scripts/seed-admin.js admin@example.com MySecurePassword123

# Or via kubectl
kubectl exec -it deployment/leo-json-backend -- \
  node src/scripts/seed-admin.js admin@example.com MySecurePassword123
```

---

## Monitoring & Logging

### Basic Health Checks

```bash
# Backend healthz (recommended to add)
curl http://localhost:3001/api/v2

# Frontend
curl http://localhost:3002

# MongoDB
mongo "mongodb://root:root123@localhost:27017/leo_json?authSource=admin"
```

### Log Aggregation (Production)

**CloudWatch (AWS)**:
```javascript
// In backend app.js
import AWSSDKClient from 'aws-sdk';
const cloudwatch = new AWSSDKClient.CloudWatch();
// Log aggregation setup
```

**ELK Stack (Self-hosted)**:
- Elasticsearch: Store logs
- Logstash: Parse + forward
- Kibana: Visualize

**Datadog** (SaaS):
```bash
# Agent installation
DD_AGENT_MAJOR_VERSION=7 DD_API_KEY=<key> \
DD_SITE=datadoghq.com bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_agent.sh)"
```

### Alerts

Set up alerts for:
- Backend process exits/crashes
- MongoDB connection failures
- High memory/CPU usage
- API error rate > 5%
- Response time > 500ms

---

## Backup & Recovery

### Database Backups

**MongoDB Atlas**: Automated daily snapshots (included)

**Self-hosted**: Manual backups
```bash
# Full backup
mongodump --uri="mongodb://root:root123@localhost:27017/leo_json?authSource=admin" \
  --out=/backups/leo_json_$(date +%Y%m%d)

# Restore
mongorestore --uri="mongodb://root:root123@localhost:27017/leo_json?authSource=admin" \
  /backups/leo_json_20260324
```

### File Cache Backups

```bash
# Backup bin cache
tar -czf bin_cache_$(date +%Y%m%d).tar.gz backend/data/

# Restore
tar -xzf bin_cache_20260324.tar.gz -C backend/
```

### Volume Snapshots (AWS/GCP)

```bash
# AWS EBS snapshot
aws ec2 create-snapshot --volume-id vol-xxxxxx --description "leo-json backup"

# GCP snapshot
gcloud compute disks snapshot leo-json-data \
  --snapshot-names=leo-json-backup-20260324
```

---

## Performance Tuning

### Backend

```javascript
// Implement caching headers
res.set('Cache-Control', 'public, max-age=3600');

// Use MongoDB connection pooling
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected, pool size:', mongoose.connection.db.getClient().topology.s.pool.totalConnectionCount);
});

// Add request logging/metrics
import morgan from 'morgan';
app.use(morgan('combined'));
```

### Frontend

```bash
# Next.js optimization
npm run build

# Check bundle size
npm install -g next-bundle-analyzer
ANALYZE=true npm run build
```

### Database

```bash
# Create indexes
db.jsonbins.createIndex({ slug: 1 }, { unique: true })
db.jsonbins.createIndex({ userId: 1, group: 1 })
db.users.createIndex({ email: 1 }, { unique: true })

# Monitor slow queries
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().limit(5).sort({ ts: -1 }).pretty()
```

---

## Troubleshooting

### Backend won't connect to MongoDB

```bash
# Check connection string
MONGO_URI=mongodb://user:pass@host:27017/leo_json?authSource=admin

# Test connection
docker exec leo-json-backend \
  node -e "const m=require('mongoose'); m.connect(process.env.MONGO_URI).then(()=>console.log('OK')).catch(e=>console.log('ERR:', e.message))"

# Common issues:
# - Username/password incorrect
# - IP not whitelisted (Atlas)
# - Database doesn't exist (create first)
# - Connection timeout (firewall)
```

### Frontend can't reach backend

```bash
# Check NEXT_PUBLIC_API_URL
echo $NEXT_PUBLIC_API_URL

# From browser console
fetch('http://localhost:3001/api/v2?target=test')
  .catch(e => console.log('CORS error:', e.message))

# In Docker, use service name
BACKEND_URL=http://leo-json-backend:3001

# Enable CORS in backend (already enabled)
app.use(cors({ origin: process.env.FRONTEND_URL }));
```

### Session cookie not persisting

```bash
# AUTH_SECRET must be set and consistent
echo $AUTH_SECRET  # Must be 32+ chars

# Check secure cookie settings
# In production: use https
# In dev: http://localhost is allowed

# Clear browser cookies and retry login
```

### File cache missing after restart

```bash
# Check volume is mounted
docker inspect leo-json-backend | grep Mounts

# If mounted but empty, data was lost
# Restore from backup or reseed

# For production:
# 1. Use external storage (S3, GCS)
# 2. Or accept cache loss (re-syncs on next update)
```

---

## Scaling Strategies

| Component | Single Replica | Multiple Replicas |
|-----------|---|---|
| **Frontend** | 1 Next.js server | Load balancer + 2-5 instances |
| **Backend** | 1 Express server | Load balancer + 2-10 instances |
| **MongoDB** | Single node | Replication set (3+ nodes) |
| **File Cache** | Local disk | Redis or S3 |
| **Session Store** | Memory | Redis |

### Horizontal Scaling

```bash
# Docker Compose with multiple backends (manual)
docker run -d \
  --name leo-json-backend-2 \
  --network app-net \
  -e MONGO_URI=mongodb://root:root123@mongodb:27017/leo_json \
  leo-json-backend:2.0.0

# Kubernetes auto-scaling
kubectl autoscale deployment leo-json-backend \
  --min=2 --max=10 --cpu-percent=70
```

### Caching Layer (Redis)

```javascript
// backend/src/config/redis.js
import redis from 'redis';

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

// Cache frequently read bins
export async function getCachedBin(slug) {
  const cached = await client.get(`bin:${slug}`);
  if (cached) return JSON.parse(cached);
  const bin = await JsonBin.findOne({ slug });
  await client.setEx(`bin:${slug}`, 3600, JSON.stringify(bin));
  return bin;
}
```

---

## Maintenance Checklist

- [ ] Weekly: Check error logs and fix issues
- [ ] Weekly: Verify backups are running
- [ ] Monthly: Review security patches (npm audit)
- [ ] Monthly: Check disk space (MongoDB, file cache)
- [ ] Quarterly: Load test and capacity planning
- [ ] Quarterly: Security audit (OWASP Top 10)
- [ ] Annually: Disaster recovery drill

