# Digital Legacy Manager - System Architecture

## 1. Overview
**Digital Legacy Manager** is an enterprise-grade digital estate management system engineered with Spring Boot 3 (Java 21), React 18, Vite, and MySQL 8. The application allows users (owners) to securely catalog their digital assets, designate beneficiaries, specify conditional access permissions, and initiate emergency transfer workflows under strict administrative review.

---

## 2. Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT LAYER                                      |
|                                                                                   |
|   +----------------------------------+     +----------------------------------+   |
|   |            USER PANEL            |     |           ADMIN PANEL            |   |
|   |  (React 18 / Vite / Bootstrap 5) |     |  (React 18 / Vite / Bootstrap 5) |   |
|   |  - Dashboard & Charts            |     |  - Platform Metrics & Analytics  |   |
|   |  - Digital Asset Management      |     |  - Global User & Status Control  |   |
|   |  - Beneficiaries & Permissions   |     |  - Asset & Verification Overlord |   |
|   |  - Emergency Claim Tracking      |     |  - Claim Approval Workflow       |   |
|   +-----------------+----------------+     +-----------------+----------------+   |
+---------------------|----------------------------------------|--------------------+
                      | JWT Bearer Token                       | JWT Bearer Token
                      v                                        v
+-----------------------------------------------------------------------------------+
|                                BACKEND REST API                                   |
|                          (Spring Boot 3.3.5 / Java 21)                            |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                            SPRING SECURITY FILTER                           |  |
|  |  - CORS Config (Origins, Allowed Headers, Exposed JWT)                     |  |
|  |  - Stateless Session (SessionCreationPolicy.STATELESS)                      |  |
|  |  - JwtAuthenticationFilter (HMAC-SHA256 Token Validation)                  |  |
|  |  - CustomAccessDeniedHandler & JwtAuthenticationEntryPoint                  |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
|  +---------------------------+  +---------------------------+  +---------------+  |
|  |      USER CONTROLLERS     |  |     ADMIN CONTROLLERS     |  | AUTH / PUBLIC |  |
|  | - AssetController         |  | - AdminController         |  | - AuthControll|  |
|  | - BeneficiaryController   |  |   (@PreAuthorize          |  | - CategoryCtrl|  |
|  | - PermissionController    |  |    hasRole('ADMIN'))      |  +---------------+  |
|  | - EmergencyRequestCtrl    |  +---------------------------+                     |
|  | - NotificationController  |                                                    |
|  +---------------------------+                                                    |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                             SERVICE & SECURITY                              |  |
|  | - AES-256-GCM Sensitive Identifier Encryption (EncryptionUtil)             |  |
|  | - AES-256 Encrypted Local File Storage with SHA-256 Checksums               |  |
|  | - IDOR Isolation (findByIdAndUserId queries)                               |  |
|  | - Synchronous & Asynchronous Activity & Security Audit Logging             |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                            SPRING DATA JPA / ORM                            |  |
|  | - 15 Entities, 15 Repositories, Custom JPQL Aggregation Queries             |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                                DATABASE LAYER                                     |
|                                  (MySQL 8.0)                                      |
|                                                                                   |
|  - Flyway Migrations (V1 Schema, V2 Master Seed)                                  |
|  - 15 Normalized Relational Tables                                                |
|  - Foreign Key Constraints, Indexes on user_id, status, email                     |
|  - UTF8MB4 Full Unicode Support                                                   |
+-----------------------------------------------------------------------------------+
```

---

## 3. Security Highlights
1. **Zero Credential Storage:** System policies prohibit storing third-party plaintext passwords or login credentials.
2. **AES-256-GCM Encryption:** Sensitive asset references (e.g. account numbers, policy IDs) are encrypted at rest with authenticated AES-256-GCM.
3. **IDOR Mitigation:** All repository methods access user-owned entities strictly via scoped clauses `findByIdAndUserId()`.
4. **Role Isolation:** Normal user registration defaults strictly to `ROLE_OWNER`. Administrator provisioning is restricted to database seeding or verified administrator intervention.
5. **Session Security:** Passwords hashed with BCrypt (Cost factor 12). JSON Web Tokens issued with HMAC-SHA256 signatures and strict expiration intervals.
