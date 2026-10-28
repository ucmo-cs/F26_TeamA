# Loan Repayment Tracker — Spring Backend

Java / Spring Boot **application server** for the UCM Fall 2026 assignment.  
Works with the React **web server** (Vite) and a **MySQL database server**.

## Three-tier layout

| Tier | Technology | Default |
|------|------------|---------|
| Web | React + Vite | `http://localhost:5173` |
| Application | Spring Boot | `http://localhost:8080` |
| Database | MySQL 8 | `localhost:3306` / `loan_tracker` |

## Prerequisites

- **JDK 17+** (you already have one under `~/Library/Java/JavaVirtualMachines/`)
- **MySQL 8** (or Docker) — only needed for the MySQL profile
- **No global Maven install required** — use `./mvnw` in this folder

### If `java` is not found in your terminal

```bash
export JAVA_HOME="$HOME/Library/Java/JavaVirtualMachines/ms-17.0.20.1/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
```

## Start MySQL (Docker)

Your Mac may already have MySQL on port **3306**. This project’s Docker MySQL uses **3307** so they don’t clash.

```bash
cd backend
# If `docker` is not found:
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"

docker compose up -d
```

Credentials (also in `application-mysql.properties`):

- Host/port: `localhost:3307`
- Database: `loan_tracker`
- User: `loanuser`
- Password: `loanpass`

## Run the application server

Default profile is **H2** (in-memory) so you can run without MySQL installed:

```bash
cd backend
./mvnw spring-boot:run
```

(`./mvnw` downloads Maven automatically the first time — you do **not** need `mvn` installed.)

### Assignment MySQL mode (three-tier)

```bash
docker compose up -d
./mvnw spring-boot:run -Dspring-boot.run.profiles=mysql
```

Or set `spring.profiles.active=mysql` in `application.properties`.

## Run the React web server

From the project root (`Loan-Repayment-Tracker/`):

```bash
npm install
npm run client
```

Vite proxies `/api` → `http://localhost:8080`.

## Demo accounts (seeded)

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Customer | `collin`, `tyreek`, `patrick` | `customer123` |

Some loans are **partially repaid** for demo purposes (assignment requirement).

## API overview

- `POST /api/auth/login`
- `GET/POST/DELETE /api/admin/loans`, `GET /api/admin/loans/{id}`, `GET /api/admin/emails`
- `GET /api/customer/loans`, `GET /api/customer/loans/{id}`
- `PUT /api/customer/profile` (name, email, phone, bank details)
- `POST /api/customer/loans/{id}/schedule` (enforces amortization minimum by frequency)

Creating a loan auto-creates a customer account (password `customer123`) and emails the customer their login details (when mail is configured).

## Real email (SMTP)

By default emails are only logged in the Admin → Emails page. To **actually send** mail to the customer’s address:

### 1. Gmail App Password (recommended for demos)

1. Turn on **2-Step Verification** on the Google account you’ll send from.
2. Create an **App password**: [Google App Passwords](https://myaccount.google.com/apppasswords) → Mail → generate.
3. Copy the 16-character password.

### 2. Start the API with mail enabled

```bash
export JAVA_HOME="$HOME/Library/Java/JavaVirtualMachines/ms-17.0.20.1/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"

export MAIL_USERNAME="yourgmail@gmail.com"
export MAIL_PASSWORD="xxxx xxxx xxxx xxxx"   # app password, not your normal password
export MAIL_FROM="yourgmail@gmail.com"

cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=mysql,mail
```

When an admin creates a loan, the customer receives an email with username/password.  
A copy is still stored in `email_log` (Admin → Emails), including whether SMTP succeeded.

### Other SMTP providers

Override host/port if needed:

```bash
export MAIL_HOST=smtp.office365.com
export MAIL_PORT=587
```
