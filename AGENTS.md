# AGENTS.md

## Quick Start

```bash
# Backend requires PostgreSQL database 'oms_dev' created first
createdb oms_dev  # or: psql -c "CREATE DATABASE oms_dev;"

# Backend
cd backend && ./mvnw spring-boot:run

# Frontend
cd frontend && npm start
```

## Commands

### Backend
- `./mvnw spring-boot:run` — Run dev server (port 8080)
- `./mvnw test` — Run all tests (JUnit 5 + Mockito)
- `./mvnw test -Dtest=ClassName` — Run single test class
- `./mvnw package -DskipTests` — Build JAR

### Frontend
- `npm start` — Dev server (port 4200)
- `npm test` — Run Jest tests (not Karma)
- `npm run lint` — ESLint
- `npm run build` — Production build

## Environment Variables

| Variable | Default | Required |
|----------|---------|----------|
| `DB_USER` | `postgres` | Yes |
| `DB_PASSWORD` | `postgres` | Yes |
| `JWT_SECRET` | `dev-secret-change-in-production` | Yes |

## Quirks

- **Database**: Must create `oms_dev` manually before running backend — no docker-compose
- **Testing**: Frontend uses Jest (unusual for Angular), not Karma/Jasmine
- **Path aliases**: Frontend has `@core`, `@shared`, `@features` (see jest.config.ts)
- **Architecture tests**: Backend uses ArchUnit (`com.tngtech.archunit`)
- **H2**: Backend tests run against H2 (test scope), not PostgreSQL

## Auth

- Login endpoint: `POST /api/auth/login`
- Returns JWT token; all other endpoints require Bearer token
- Roles: `ADMIN` (full), `USER` (read + own orders)

## SDD Workflow

Project uses OpenSpec SDD (see `/openspec/changes/`). Use `sdd-*` skills for design/spec cycle.