# Digital Legacy Manager - Database Schema Design

The `digital_legacy_manager` database comprises **15 normalized relational tables** managed through Flyway versioned migrations.

---

## Entity Relationship Overview

```
                        +---------------+
                        |     users     |<------------------+
                        +-------+-------+                   |
                                |                           |
          +---------------------+-------------------+       |
          |                     |                   |       |
          v                     v                   v       |
  +---------------+     +---------------+   +---------------+
  | user_profiles |     |digital_assets |   | beneficiaries |
  +---------------+     +-------+-------+   +-------+-------+
                                |                   |
                                +---------+---------+
                                          |
          +-------------------------------+-------------------------------+
          |                               |                               |
          v                               v                               v
+--------------------+          +--------------------+          +--------------------+
| asset_beneficiaries|          | asset_permissions  |          | emergency_requests |
+--------------------+          +--------------------+          +--------------------+
```

---

## Tables Catalog

### 1. `users`
Core user credentials and role definitions.
- `id` (BIGINT PRIMARY KEY AUTO_INCREMENT)
- `email` (VARCHAR(150) UNIQUE NOT NULL)
- `password` (VARCHAR(255) NOT NULL - BCrypt hash)
- `role` (ENUM('OWNER', 'BENEFICIARY', 'VERIFIER', 'ADMIN') NOT NULL DEFAULT 'OWNER')
- `status` (ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE')
- `failed_login_attempts` (INT DEFAULT 0)
- `account_locked_until` (DATETIME)
- `created_at`, `updated_at` (DATETIME)

### 2. `user_profiles`
Detailed profile metadata.
- `id`, `user_id` (FK -> users.id UNIQUE), `full_name`, `phone_number`, `avatar_url`, `address`, `email_verified`, `phone_verified`, timestamps.

### 3. `asset_categories`
Master asset categories (11 categories seeded).
- `id`, `name`, `code` (UNIQUE), `description`, `icon`, `is_active`, `created_at`.

### 4. `digital_assets`
Catalog of digital estate assets.
- `id`, `user_id` (FK -> users.id), `category_id` (FK -> asset_categories.id), `name`, `platform_name`, `asset_identifier` (Encrypted via AES-256-GCM), `description`, `transfer_instructions`, `status` (ENUM('ACTIVE', 'ARCHIVED', 'PENDING_TRANSFER', 'TRANSFERRED')), timestamps.

### 5. `beneficiaries`
Designated asset heirs and contacts.
- `id`, `owner_id` (FK -> users.id), `full_name`, `email`, `phone_number`, `relationship`, `address`, `verification_status` (ENUM('UNVERIFIED', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED')), `beneficiary_user_id` (FK -> users.id NULL), timestamps.

### 6. `asset_beneficiaries`
Many-to-many relationship mapping assets to assigned beneficiaries.
- `id`, `asset_id` (FK), `beneficiary_id` (FK), `assigned_percentage`, timestamps.

### 7. `asset_permissions`
Granular permission grants.
- `id`, `asset_id` (FK), `beneficiary_id` (FK), `permission_type` (ENUM('VIEW', 'DOWNLOAD', 'TRANSFER', 'LIMITED_ACCESS', 'EMERGENCY_ACCESS')), `access_condition`, `effective_from`, `expires_at`, `is_revoked`, timestamps.

### 8. `uploaded_files`
Secure encrypted file metadata.
- `id`, `asset_id` (FK), `uploader_id` (FK), `original_file_name`, `storage_path`, `file_size_bytes`, `mime_type`, `sha256_checksum`, `is_encrypted`, timestamps.

### 9. `emergency_requests`
Life event & incapacity emergency asset access claims.
- `id`, `asset_id` (FK), `beneficiary_id` (FK), `owner_id` (FK), `reason`, `evidence_file_id` (FK), `status` (ENUM('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED')), `reviewed_by_admin_id` (FK), `admin_notes`, `reviewed_at`, `completed_at`, timestamps.

### 10. `verification_records`
Identity verification records for beneficiaries.
- `id`, `beneficiary_id` (FK), `verifier_admin_id` (FK), `verification_type`, `document_file_id` (FK), `status` (VARCHAR/ENUM), `rejection_reason`, `verified_at`, timestamps.

### 11. `notifications`
System & lifecycle alerts for users.
- `id`, `user_id` (FK), `title`, `message`, `type` (ENUM('SYSTEM', 'ASSET', 'BENEFICIARY', 'PERMISSION', 'EMERGENCY_REQUEST', 'SECURITY')), `is_read`, `read_at`, `created_at`.

### 12. `activity_logs`
User operational activity history.
- `id`, `user_id` (FK), `action`, `description`, `ip_address`, `user_agent`, `created_at`.

### 13. `admin_audit_logs`
Administrator security audit trail.
- `id`, `admin_id` (FK), `action`, `target_entity`, `target_id`, `details`, `ip_address`, `created_at`.

### 14. `system_settings`
Platform configuration key-value storage.
- `id`, `setting_key` (UNIQUE), `setting_value`, `description`, `updated_by_admin_id` (FK), `updated_at`.

### 15. `administrator_permissions`
Sub-admin role permissions.
- `id`, `admin_id` (FK), `permission_name`, `granted_at`.
