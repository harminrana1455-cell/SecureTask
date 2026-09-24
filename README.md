# SecureTask

A production-style task management web application built for a university DevOps assessment.
Implements a complete Jenkins CI/CD pipeline across 7 stages: Build → Test → Code Quality → Security → Deploy → Release → Monitoring.

---

## Architecture

```
SecureTask/
├── frontend/          React + Vite + Tailwind CSS (Nginx in Docker)
├── backend/           Node.js + Express + MongoDB (REST API)
├── docker-compose.yml Multi-service orchestration
├── Jenkinsfile        7-stage CI/CD pipeline
├── sonar-project.properties  SonarQube config
└── .env.example       Environment variable template
```

**Backend structure:**
```
backend/src/
  config/       Database connection
  controllers/  Route handlers
  middleware/   Auth, validation, error handling
  models/       Mongoose schemas (User, Task)
  routes/       Express routers
  services/     Business logic layer
  utils/        Logger, API response helpers
```

---

## Features

### Authentication
- Register / Login with JWT
- bcryptjs password hashing (12 rounds)
- Protected routes via Bearer token middleware
- Frontend logout removes auth state

### Tasks (CRUD)
- Create, read, update, delete tasks
- Mark task as completed
- Fields: title, description, priority (Low/Medium/High), status (Todo/In Progress/Completed), dueDate

### Dashboard
- Stats: total, todo, in-progress, completed, overdue
- Filter by status and priority

---

## Technologies

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Axios, React Router v6 |
| Backend | Node.js 20, Express 4, Mongoose 8 |
| Database | MongoDB 7 |
| Auth | JWT, bcryptjs, Helmet, CORS, express-rate-limit |
| Validation | express-validator |
| Testing | Jest, Supertest |
| Quality | ESLint, SonarQube-compatible |
| Docker | Docker, Docker Compose, Nginx |
| DevOps | Jenkins, npm audit, Trivy-ready |

---

## Setup

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)
- Docker & Docker Compose (for containerized run)

### Environment Variables

Copy `.env.example` to `backend/.env` and fill values:

```bash
cp .env.example backend/.env
```

| Variable | Description | Default |
|---|---|---|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/securetask` |
| `JWT_SECRET` | Secret key for JWT signing (min 32 chars) | **Required** |
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `BCRYPT_ROUNDS` | bcrypt salt rounds | `12` |
| `CORS_ORIGIN` | Frontend origin for CORS | `http://localhost:5173` |

---

## Local Development

### Backend

```bash
cd backend
npm install
cp ../.env.example .env  # fill in values
npm run dev              # starts on port 5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev              # starts on port 5173, proxies /api to port 5000
```

---

## Docker Setup

```bash
# Copy and configure environment
cp .env.example .env
# Edit .env and set JWT_SECRET

# Build and start all services
docker compose up --build

# Access:
#   Frontend:  http://localhost:3000
#   Backend:   http://localhost:5000
#   API Health: http://localhost:5000/api/health
```

Stop and clean up:
```bash
docker compose down -v
```

---

## Test Command

```bash
cd backend
npm test                   # Run all tests (exits non-zero on failure)
npm run test:coverage      # With coverage report
```

Tests cover:
- Auth: register, duplicate email, login, invalid credentials, JWT guard, invalid token
- Tasks: CRUD, ownership isolation, filtering, mark complete
- Validation: missing title, invalid priority/status
- Dashboard: statistics endpoint
- Health: /api/health

---

## Lint Command

```bash
# Backend
cd backend && npm run lint

# Frontend
cd frontend && npm run lint
```

---

## API Endpoints

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login, returns JWT |

### Tasks (🔒 Authenticated)
| Method | Path | Description |
|---|---|---|
| GET | `/api/tasks` | Get all user tasks (filter: `?status=&priority=`) |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/:id` | Get single task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| PATCH | `/api/tasks/:id/complete` | Mark as completed |

### Dashboard (🔒 Authenticated)
| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | Total, todo, in-progress, completed, overdue counts |

### Health & Metrics (Public)
| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Service health, uptime, version |
| GET | `/api/health/db` | MongoDB connectivity check |
| GET | `/api/metrics` | Memory usage, PID, Node version |

---

## Security Practices

- Passwords hashed with bcryptjs (12 rounds)
- JWT signed with environment-provided secret (never hardcoded)
- Helmet sets security HTTP headers
- CORS restricted to configured origin
- Rate limiting: 100 req/15min globally, 20 req/15min on auth routes
- Input validation via express-validator (422 on failure)
- MongoDB queries use `{ userId }` scoping — users cannot access other users' data
- No secrets in source control — `.env` is gitignored
- Stack traces suppressed in production responses
- Passwords never logged or returned in responses

---

## DevOps / Jenkins Readiness

The `Jenkinsfile` implements 7 pipeline stages:

| Stage | Description |
|---|---|
| **Build** | `npm ci` + frontend `vite build` |
| **Test** | Jest + Supertest (non-zero exit on failure) |
| **Code Quality** | ESLint (backend + frontend) + SonarQube |
| **Security** | `npm audit --audit-level=high` |
| **Deploy** | Docker Compose to staging (configure SSH creds) |
| **Release** | Tag-triggered Docker image tagging |
| **Monitoring** | Health endpoint verification post-deploy |

### Jenkins Setup Requirements
Configure these in Jenkins before running the pipeline:
- **Credential**: `docker-hub-creds` (Docker Hub username/password)
- **Credential**: `sonar-token` (SonarQube token)
- **Global Tool**: NodeJS installation named `NodeJS-20`
- **Global Tool**: SonarQube Scanner named `SonarScanner`
- **Environment vars**: `DOCKER_REGISTRY`, `STAGING_SERVER`, `STAGING_APP_DIR`

---

## SonarQube

```bash
# Run analysis locally (requires sonar-scanner on PATH)
sonar-scanner \
  -Dsonar.host.url=http://your-sonar-server \
  -Dsonar.login=your-token
```

Coverage report (LCOV) is written to `backend/coverage/lcov.info` by `npm run test:coverage`.
