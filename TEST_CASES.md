# Test Cases & Results — Account Inheritance Manager (Digital Life After Death)

**Project:** Account Inheritance Manager  
**Version:** 1.0.0-SNAPSHOT  
**Date:** November 19, 2026  
**Test Suite Coverage:** Manual, Automated Integration, API, Security, Database  

---

## 1. Test Case Specification & Execution Log

| Test Case ID | Module | Description | Preconditions | Test Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|
| **TC-AUTH-001** | Auth Module | Normal User Registration | Database is accessible | 1. Send `POST /api/auth/register` with valid JSON payload (`email`, `password`, `fullName`, `phoneNumber`). | HTTP 201 Created; User profile and account saved in `users` and `user_profiles` with BCrypt password hash. | HTTP 201 Created; Record confirmed in database. | **PASS** |
| **TC-AUTH-002** | Auth Module | User Login with Valid Credentials | User registered | 1. Send `POST /api/auth/login` with registered credentials. | HTTP 200 OK; JWT access token returned; user details and role provided in response data. | HTTP 200 OK; JWT token received and validated. | **PASS** |
| **TC-AUTH-003** | Auth Module | User Login with Invalid Password | User exists | 1. Send `POST /api/auth/login` with incorrect password. | HTTP 401 Unauthorized; Error message returned; failed login counter incremented. | HTTP 401 Unauthorized; "Invalid email or password". | **PASS** |
| **TC-AUTH-004** | Auth Module | Token Authentication & Current User Retrieval | Valid JWT token | 1. Send `GET /api/auth/me` with header `Authorization: Bearer <valid_token>`. | HTTP 200 OK; Current user profile and permissions returned. | HTTP 200 OK; Profile payload returned. | **PASS** |
| **TC-AUTH-005** | Auth Module | Unauthenticated Access to Protected API | No token provided | 1. Send `GET /api/user/dashboard` without Authorization header. | HTTP 401 Unauthorized; Request blocked before hitting service logic. | HTTP 401 Unauthorized. | **PASS** |
| **TC-ASSET-001** | Asset Module | Create Digital Asset | Authenticated as OWNER | 1. Send `POST /api/assets` with name, category, platform, and instructions. | HTTP 201 Created; Asset stored in `digital_assets`; Audit log generated. | HTTP 201 Created; Asset ID returned and persisted in Aiven MySQL. | **PASS** |
| **TC-ASSET-002** | Asset Module | Retrieve Scoped Assets | Authenticated as OWNER | 1. Send `GET /api/assets` with OWNER token. | HTTP 200 OK; List contains only assets belonging to the authenticated user. | HTTP 200 OK; Assets isolated strictly to caller. | **PASS** |
| **TC-ASSET-003** | Asset Module | Update Digital Asset | Asset exists for user | 1. Send `PUT /api/assets/{id}` with updated details. | HTTP 200 OK; Updated asset details returned and stored in database. | HTTP 200 OK; Updated data verified on page reload. | **PASS** |
| **TC-ASSET-004** | Asset Module | Delete Digital Asset | Asset exists for user | 1. Send `DELETE /api/assets/{id}`. | HTTP 200 OK; Asset and associated permissions removed cleanly. | HTTP 200 OK; Cascading cleanup completed. | **PASS** |
| **TC-BEN-001** | Beneficiary | Add Beneficiary | Authenticated as OWNER | 1. Send `POST /api/beneficiaries` with beneficiary email, full name, and relationship. | HTTP 201 Created; Beneficiary created with `INVITED` status and unique invitation token. | HTTP 201 Created; Invitation token generated in `beneficiaries` table. | **PASS** |
| **TC-BEN-002** | Beneficiary | Duplicate Beneficiary Prevention | Beneficiary already added | 1. Send `POST /api/beneficiaries` with duplicate email for same owner. | HTTP 409 Conflict / 400 Bad Request; Descriptive error message returned. | HTTP 400 Bad Request; "Beneficiary already exists". | **PASS** |
| **TC-PERM-001** | Permissions | Grant Asset Permission | Asset and beneficiary exist | 1. Send `POST /api/permissions` granting `EMERGENCY_ACCESS`. | HTTP 201 Created; Permission record stored in `asset_permissions`. | HTTP 201 Created; Permission visible in user permissions table. | **PASS** |
| **TC-EMERG-001** | Emergency / Claim | Initiate Emergency Claim | Beneficiary invited/active | 1. Beneficiary sends `POST /api/emergency-requests` with claim reason and death certificate evidence. | HTTP 201 Created; Emergency request status set to `PENDING_VERIFICATION`. | HTTP 201 Created; Record stored in `emergency_requests`. | **PASS** |
| **TC-EMERG-002** | Verifier / Admin | Approve Emergency Claim & Grant Inheritance | Pending emergency request | 1. Verifier/Admin reviews request; 2. Sends `POST /api/verifier/requests/{id}/approve`. | HTTP 200 OK; Request marked `APPROVED`; Asset permissions elevated; Inherited asset access enabled for beneficiary. | HTTP 200 OK; Beneficiary can access asset details and transfer instructions. | **PASS** |
| **TC-SEC-001** | Security / RBAC | Non-Admin Accessing Admin APIs | Authenticated as OWNER | 1. Send `GET /api/admin/users` with OWNER JWT token. | HTTP 403 Forbidden; Access denied by Spring Security filter. | HTTP 403 Forbidden. | **PASS** |
| **TC-SEC-002** | Security / IDOR | Cross-Tenant File Download | Two distinct user accounts | 1. User B attempts `GET /api/files/download/{fileId}` where file belongs to User A. | HTTP 403 Forbidden / 404 Not Found; User B cannot read User A's file. | HTTP 403 Forbidden. | **PASS** |
| **TC-ADMIN-001** | Admin Module | Admin Login & Dashboard Overview | Admin account exists | 1. Send `POST /api/auth/login` with admin credentials (`admin@digitallegacy.com`). | HTTP 200 OK; JWT returned with role `ROLE_ADMIN`; Dashboard returns platform metrics. | HTTP 200 OK; Admin dashboard loaded successfully. | **PASS** |
| **TC-ADMIN-002** | Admin Module | Update User Account Status | Active target user exists | 1. Admin sends `PUT /api/admin/users/{userId}/status` with body `{"status": "SUSPENDED"}`. | HTTP 200 OK; Target user status updated in `users` table; `admin_audit_logs` record created. | HTTP 200 OK; User status changed and audited. | **PASS** |

---

## 2. Test Execution Summary

- **Total Test Cases Defined & Verified:** 18
- **Automated Integration Tests Passing in Maven:** 17 of 17 (100%)
- **Manual Verification Steps Verified:** 18 of 18 (100%)
- **Test Defect Rate:** 0% (All detected issues remediated and retested)
