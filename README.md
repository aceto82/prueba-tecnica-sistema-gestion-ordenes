# Order Management System (OMS)

A fullstack order management system built with Spring Boot (backend) and Angular (frontend).

## Prerequisites

- Java 17+
- Node 20+
- PostgreSQL 14+

## Running the Backend

```bash
cd backend
./mvnw spring-boot:run
```

The backend starts on http://localhost:8080.

## Running the Frontend

```bash
cd frontend
npm start
```

The frontend starts on http://localhost:4200.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_USER` | `postgres` | PostgreSQL username |
| `DB_PASSWORD` | `postgres` | PostgreSQL password |
| `JWT_SECRET` | `dev-secret-change-in-production` | JWT signing secret |

## Database Setup

Create a PostgreSQL database named `oms_dev` before starting the backend in dev mode:

```sql
CREATE DATABASE oms_dev;
```
