# Digital Legacy Manager

A secure, enterprise-grade, full-stack digital estate management platform engineered with **Java 21**, **Spring Boot 3.3.5**, **React 18**, **Vite**, and **MySQL 8.0**.

The system enables users to catalog digital assets, designate beneficiaries, configure role-based conditional access, and execute secure emergency asset transfer workflows with administrative review and audit trails.

---

## 🔑 Quick Demo Credentials (Ready-To-Use)

Both user accounts are pre-seeded in the database and pre-filled on the login pages with 1-click auto-fill:

### 👤 Demo Estate Owner (User Panel)
- **URL:** [http://localhost:5173/login](http://localhost:5173/login)
- **Email:** `user@digitallegacy.com`
- **Password:** `User@12345`
- *Pre-seeded with:* 4 Digital Assets (Brokerage, Photos Cloud Vault, Bitcoin Wallet, Web Domain), 3 Designated Beneficiaries (Daughter, Son, Attorney), and 3 Active Permission grants.

### 🛡️ Administrator (Admin Panel)
- **URL:** [http://localhost:5173/admin/login](http://localhost:5173/admin/login)
- **Email:** `admin@digitallegacy.com`
- **Password:** `Admin@123`

---

## 🌟 Key Features

### 👤 User Panel
- **Secure Authentication:** BCrypt password encryption, JWT authorization, session expiration handling.
- **Estate Dashboard:** Dynamic real-time metrics, asset category distribution charts, recent activity and notification feeds.
- **Asset Management:** Categorize, search, filter, and manage digital assets across 11 master categories.
- **Encryption at Rest:** Sensitive asset references protected with **AES-256-GCM** authenticated encryption with reveal/hide controls.
- **Beneficiary Management:** Designate trusted beneficiaries, establish relationships, and track verification statuses.
- **Granular Permissions:** Grant conditional permissions (`VIEW`, `DOWNLOAD`, `TRANSFER`, `LIMITED_ACCESS`, `EMERGENCY_ACCESS`) with revocability.
- **Emergency Access Workflow:** Submit and track emergency access claims with reason validation and administrative review.
- **Audit & History:** Full activity logging and in-app notifications.

### 🛡️ Admin Panel (Strictly Isolated)
- **Dedicated Admin Authentication:** Dedicated `/admin/login` page with server-side `ROLE_ADMIN` validation.
- **Executive Dashboard:** Real-time metrics across all platform users, assets, beneficiaries, claims, and category distributions.
- **User Account Management:** Search, view, activate, deactivate, or suspend user accounts with instant revocation of access tokens.
- **Global Asset & Beneficiary Directory:** Inspect platform-wide asset records and monitor beneficiary verifications.
- **Claim Review System:** Review, approve, or reject beneficiary emergency access claims with mandatory administrative notes.
- **Security Audit Trail:** Immutable log of all administrative actions, target entities, IP addresses, and timestamps.
- **System Settings Configuration:** Manage dynamic platform settings and maintenance flags.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Backend** | Java 21, Spring Boot 3.3.5, Spring Security 6, Spring Data JPA, Hibernate 6, JJWT 0.12.6, Maven |
| **Frontend** | React 18, Vite 5, JavaScript (ES6+), Bootstrap 5, Bootstrap Icons, Chart.js, Axios, React Router v6, React-Toastify |
| **Database** | MySQL 8.0, Flyway DB Migrations (15 normalized tables, UTF8MB4) |
| **Security** | BCrypt (Cost 12), AES-256-GCM encryption, JWT Bearer tokens, IDOR mitigation (`findByIdAndUserId`) |
| **Testing** | JUnit 5, MockMvc, SpringBootTest, 11/11 automated integration tests passing |

---

## 📁 Project Structure

```
C:\Project Codebegun\
├── digital-legacy-backend\          # Spring Boot 3 Backend
│   ├── pom.xml
│   ├── src\main\java\com\digitallegacy\
│   │   ├── config\                  # Security, JPA Auditing, OpenAPI Swagger
│   │   ├── controller\              # Auth, User, Asset, Beneficiary, Admin Controllers
│   │   ├── dto\                     # Request and Response DTOs
│   │   ├── entity\                  # 15 JPA Entities & Enums
│   │   ├── repository\              # 15 Spring Data JPA Repositories
│   │   ├── security\                # JWT filter, UserPrincipal, Access Denied Handler
│   │   ├── service\                 # Business logic interfaces and implementations
│   │   └── util\                    # AES-256-GCM Encryption utilities
│   ├── src\main\resources\
│   │   ├── application.yml          # Spring configuration
│   │   ├── application-dev.yml      # Local dev configuration
│   │   ├── application-prod.yml     # Production configuration
│   │   └── db\migration\            # Flyway V1 (schema) & V2 (master seed)
│   └── src\test\                    # JUnit 5 MockMvc Integration Tests
├── digital-legacy-frontend\         # React 18 / Vite Frontend
│   ├── package.json
│   ├── vite.config.js               # Proxy /api to backend
│   └── src\
│       ├── api\                     # Axios clients for Auth, Assets, Admin, etc.
│       ├── components\              # UserLayout, AdminLayout, ProtectedRoute, AdminRoute
│       ├── context\                 # AuthContext (JWT in memory / sessionStorage)
│       └── pages\                   # Public, User Panel, and Admin Panel pages
├── database\
│   ├── digital_legacy_manager.sql   # Complete MySQL schema dump
│   └── e2e_live_test.ps1            # Automated E2E verification script
├── docs\                            # Architecture, API docs, Deployment & Database guides
└── postman\                         # Comprehensive Postman API collection
```

---

## 🚀 Getting Started

### 1. Database Setup
Ensure MySQL 8.0 is running locally:
```sql
CREATE DATABASE IF NOT EXISTS digital_legacy_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend Startup
```bash
cd digital-legacy-backend
mvn spring-boot:run
```
- Server starts on: `http://localhost:8080`
- Swagger UI available at: `http://localhost:8080/swagger-ui.html`

### 3. Frontend Startup
```bash
cd digital-legacy-frontend
npm install
npm run dev
```
- Client starts on: `http://localhost:5173`

---

## 🧪 Testing & Verification

Run the comprehensive integration test suite:
```bash
cd digital-legacy-backend
mvn test
```
Result: **15 integration tests executed across 5 test suites, 0 failures, 0 errors, 0 skipped**.
- `AdminPanelIntegrationTest`: 4 tests (metrics, status lifecycle, access revocation, audit logs)
- `ApplicationContextTest`: 1 test (Spring context bootstrap)
- `AuthIntegrationTest`: 5 tests (registration, duplicate protection, password requirements, login, admin authentication)
- `CrossUserFileSecurityIntegrationTest`: 4 tests (owner download, IDOR zero-trust isolation, admin cross-panel review, anonymous blocking)
- `UserPanelIntegrationTest`: 1 test (end-to-end asset, beneficiary, and conditional permission workflows)

---

## 🐳 Docker Container Orchestration

Run the entire full-stack platform (MySQL 8 + Backend + Nginx Frontend) in Docker:
```bash
# 1. Copy sample environment file
cp .env.example .env

# 2. Build and launch all services in detached mode
docker-compose up --build -d
```

- **Frontend Application:** `http://localhost:80`
- **Backend API:** `http://localhost:8080/api`
- **MySQL Database:** `localhost:3307`
- **Persistent Storage Volumes:** `mysql_data`, `encrypted_vault_files`

---

## 💾 Disaster Recovery & Vault Backups

Automated PowerShell backup & restore scripts for MySQL dumps and AES-256 encrypted vault snapshots:
```powershell
# Run full backup
.\database\backup_database.ps1

# Restore from backup snapshot
.\database\restore_database.ps1 -BackupFolderPath ".\database\backups\backup_YYYYMMDD_HHMMSS"
```

---

## 📚 Documentation
- [Architecture Blueprint](docs/ARCHITECTURE.md)
- [API Reference](docs/API_DOCUMENTATION.md)
- [Database Schema Design](docs/DATABASE_SCHEMA.md)
- [Production Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
