# Digital Legacy Manager - API Documentation

Base URL: `http://localhost:8080/api` (Swagger UI: `http://localhost:8080/swagger-ui.html`)

---

## 1. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/register`
Register a new account (Role: `OWNER`).
- **Body:**
  ```json
  {
    "fullName": "Alice Smith",
    "email": "alice@example.com",
    "phoneNumber": "+1234567890",
    "password": "Password@123",
    "confirmPassword": "Password@123",
    "termsConsent": true
  }
  ```
- **Response:** 201 Created with JWT `token`, `userId`, `email`, `role`.

### `POST /api/auth/login`
Authenticate user with email and password.
- **Body:**
  ```json
  {
    "email": "alice@example.com",
    "password": "Password@123"
  }
  ```
- **Response:** 200 OK with `token`.

### `POST /api/auth/admin-login`
Authenticate administrator. Verifies `ROLE_ADMIN` server-side.
- **Body:**
  ```json
  {
    "email": "admin@digitallegacy.com",
    "password": "Admin@12345"
  }
  ```
- **Response:** 200 OK with admin JWT `token`.

### `GET /api/auth/me`
Retrieve currently authenticated user profile.
- **Header:** `Authorization: Bearer <token>`
- **Response:** 200 OK.

---

## 2. Public Endpoints (`/api/categories`)

### `GET /api/categories`
Retrieve all active digital asset categories.
- **Response:** 200 OK with list of 11 asset categories (Social Media, Banking, Crypto, etc.).

---

## 3. User Panel Endpoints (`/api/**`)
*All require `Authorization: Bearer <userToken>`*

### Dashboard
- `GET /api/user/dashboard` - Get user-scoped aggregate stats (assets, beneficiaries, active permissions, requests, category distribution, recent activities, recent notifications).

### Digital Assets
- `GET /api/assets?page=0&size=20&search=` - Paginated asset list.
- `GET /api/assets/{id}` - Asset details (decrypted `assetIdentifier`).
- `POST /api/assets` - Create asset with optional file attachments (multipart/form-data).
- `POST /api/assets/simple` - Create asset with JSON payload.
- `PUT /api/assets/{id}` - Update asset.
- `DELETE /api/assets/{id}` - Delete asset.

### Beneficiaries
- `GET /api/beneficiaries` - List beneficiaries.
- `GET /api/beneficiaries/{id}` - Beneficiary details.
- `POST /api/beneficiaries` - Add beneficiary.
- `PUT /api/beneficiaries/{id}` - Update beneficiary.
- `DELETE /api/beneficiaries/{id}` - Delete beneficiary.

### Permissions
- `GET /api/permissions` - List permissions.
- `POST /api/permissions` - Grant permission (`VIEW`, `DOWNLOAD`, `TRANSFER`, `LIMITED_ACCESS`, `EMERGENCY_ACCESS`).
- `PATCH /api/permissions/{id}/revoke` - Revoke permission.
- `DELETE /api/permissions/{id}` - Delete permission.

### Emergency Requests
- `POST /api/emergency-requests` - Submit emergency access claim.
- `GET /api/emergency-requests/owner` - View claims on current user's assets.
- `GET /api/emergency-requests/beneficiary` - View claims submitted by current user.
- `GET /api/emergency-requests/{id}` - Claim details.
- `PATCH /api/emergency-requests/{id}/cancel` - Cancel pending claim.

### Notifications
- `GET /api/notifications` - Paginated user notifications.
- `GET /api/notifications/unread-count` - Total unread notifications.
- `PATCH /api/notifications/{id}/read` - Mark single notification as read.
- `PATCH /api/notifications/read-all` - Mark all notifications as read.
- `DELETE /api/notifications/{id}` - Delete notification.

---

## 4. Admin Panel Endpoints (`/api/admin/**`)
*All require `Authorization: Bearer <adminToken>` with `ROLE_ADMIN`*

### Dashboard & Analytics
- `GET /api/admin/dashboard` - Real-time platform statistics (users, assets, claims, category distribution, recent audit trail).

### User Management
- `GET /api/admin/users?page=0&size=20&search=&status=` - List platform users.
- `GET /api/admin/users/{id}` - User account details and asset counts.
- `PATCH /api/admin/users/{id}/status?status=SUSPENDED` - Modify user status (`ACTIVE`, `INACTIVE`, `SUSPENDED`).

### Estate Assets & Beneficiaries
- `GET /api/admin/assets?page=0&size=20&search=&category=` - List all assets across platform.
- `GET /api/admin/beneficiaries?page=0&size=20&search=` - List all beneficiaries.

### Emergency Access Claims Review
- `GET /api/admin/emergency-requests?page=0&size=20&status=` - List all claims.
- `PATCH /api/admin/emergency-requests/{id}/approve` - Approve emergency claim with admin notes.
- `PATCH /api/admin/emergency-requests/{id}/reject` - Reject emergency claim with reason.

### Verifications
- `GET /api/admin/verifications?page=0&size=20&status=` - List identity verification records.
- `PATCH /api/admin/verifications/{id}/approve` - Approve verification.
- `PATCH /api/admin/verifications/{id}/reject` - Reject verification.

### Audit & System Settings
- `GET /api/admin/audit-logs?page=0&size=20&adminId=` - Platform audit log trail.
- `GET /api/admin/settings` - List all system settings.
- `GET /api/admin/settings/{key}` - Get specific setting.
- `PUT /api/admin/settings/{key}?value=` - Update system setting value.
