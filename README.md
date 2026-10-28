# Loan Repayment Tracker

UCM Fall 2026 — three-tier loan repayment app.

| Tier | Folder / tool | Port |
|------|----------------|------|
| Web server | React (Vite) in this folder | `5173` |
| Application server | Spring Boot in `backend/` | `8080` |
| Database server | MySQL (`backend/docker-compose.yml`) | `3306` |

## Quick start

1. **JDK 17+** (Maven is included via `./mvnw` — no separate install).
2. **Start Spring API** (H2, no MySQL needed):
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```
   For MySQL (assignment three-tier):
   ```bash
   cd backend
   docker compose up -d
   ./mvnw spring-boot:run -Dspring-boot.run.profiles=mysql
   ```
3. **Start React**
   ```bash
   npm install
   npm run client
   ```

Open http://localhost:5173

### Demo logins

- Admin: `admin` / `admin123`
- Customer: `collin` (or `tyreek`, `patrick`) / `customer123`

More detail: [backend/README.md](backend/README.md)

## Legacy Node API

The older Express + SQLite API remains under `server/` (`npm run server:node`) but **does not** satisfy the Java/Spring/MySQL assignment requirements. Prefer `backend/`.
