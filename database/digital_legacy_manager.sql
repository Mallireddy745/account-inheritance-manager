-- =============================================================================
-- DIGITAL LEGACY MANAGER
-- Complete Database Schema & Master Seed Reference
-- Target Database: MySQL 8.0+
-- Database Name: digital_legacy_manager
-- =============================================================================

CREATE DATABASE IF NOT EXISTS digital_legacy_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE digital_legacy_manager;

-- Disable foreign key checks for clean recreation
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS administrator_permissions;
DROP TABLE IF EXISTS system_settings;
DROP TABLE IF EXISTS admin_audit_logs;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS verification_records;
DROP TABLE IF EXISTS emergency_requests;
DROP TABLE IF EXISTS uploaded_files;
DROP TABLE IF EXISTS asset_permissions;
DROP TABLE IF EXISTS asset_beneficiaries;
DROP TABLE IF EXISTS beneficiaries;
DROP TABLE IF EXISTS digital_assets;
DROP TABLE IF EXISTS asset_categories;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Users Table
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('OWNER', 'BENEFICIARY', 'VERIFIER', 'ADMIN') NOT NULL DEFAULT 'OWNER',
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    failed_login_attempts INT NOT NULL DEFAULT 0,
    account_locked_until DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. User Profiles Table
CREATE TABLE user_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(30) NULL,
    avatar_url VARCHAR(500) NULL,
    address VARCHAR(255) NULL,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Asset Categories Table
CREATE TABLE asset_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    icon VARCHAR(50) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Digital Assets Table
CREATE TABLE digital_assets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL,
    platform_name VARCHAR(150) NOT NULL,
    asset_identifier VARCHAR(255) NOT NULL,
    description TEXT NULL,
    transfer_instructions TEXT NULL,
    status ENUM('ACTIVE', 'ARCHIVED', 'PENDING_TRANSFER', 'TRANSFERRED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_digital_assets_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_digital_assets_category FOREIGN KEY (category_id) REFERENCES asset_categories (id) ON DELETE RESTRICT,
    INDEX idx_digital_assets_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Beneficiaries Table
CREATE TABLE beneficiaries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    owner_id BIGINT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone_number VARCHAR(30) NULL,
    relationship VARCHAR(100) NOT NULL,
    address TEXT NULL,
    verification_status ENUM('UNVERIFIED', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'UNVERIFIED',
    beneficiary_user_id BIGINT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_beneficiaries_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_beneficiaries_user FOREIGN KEY (beneficiary_user_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_beneficiaries_owner_email (owner_id, email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Asset-Beneficiaries Junction Table
CREATE TABLE asset_beneficiaries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    asset_id BIGINT NOT NULL,
    beneficiary_id BIGINT NOT NULL,
    allocation_percentage DECIMAL(5,2) DEFAULT 100.00,
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_asset_beneficiaries_asset FOREIGN KEY (asset_id) REFERENCES digital_assets (id) ON DELETE CASCADE,
    CONSTRAINT fk_asset_beneficiaries_beneficiary FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries (id) ON DELETE CASCADE,
    UNIQUE KEY uk_asset_beneficiary (asset_id, beneficiary_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Asset Permissions Table
CREATE TABLE asset_permissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    asset_id BIGINT NOT NULL,
    beneficiary_id BIGINT NOT NULL,
    permission_type ENUM('VIEW', 'DOWNLOAD', 'TRANSFER', 'LIMITED_ACCESS', 'EMERGENCY_ACCESS') NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    effective_from DATETIME NULL,
    expires_at DATETIME NULL,
    access_condition TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_permissions_asset FOREIGN KEY (asset_id) REFERENCES digital_assets (id) ON DELETE CASCADE,
    CONSTRAINT fk_permissions_beneficiary FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries (id) ON DELETE CASCADE,
    INDEX idx_permissions_lookup (beneficiary_id, permission_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Uploaded Files Table
CREATE TABLE uploaded_files (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    asset_id BIGINT NULL,
    file_name VARCHAR(255) NOT NULL,
    stored_file_name VARCHAR(255) NOT NULL UNIQUE,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    is_encrypted BOOLEAN NOT NULL DEFAULT TRUE,
    checksum VARCHAR(64) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_uploaded_files_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_uploaded_files_asset FOREIGN KEY (asset_id) REFERENCES digital_assets (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Emergency Requests Table
CREATE TABLE emergency_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    beneficiary_id BIGINT NOT NULL,
    owner_id BIGINT NOT NULL,
    asset_id BIGINT NOT NULL,
    reason TEXT NOT NULL,
    evidence_file_id BIGINT NULL,
    status ENUM('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    reviewed_by_admin_id BIGINT NULL,
    admin_notes TEXT NULL,
    reviewed_at DATETIME NULL,
    completed_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_emergency_beneficiary FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries (id) ON DELETE CASCADE,
    CONSTRAINT fk_emergency_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_emergency_asset FOREIGN KEY (asset_id) REFERENCES digital_assets (id) ON DELETE CASCADE,
    CONSTRAINT fk_emergency_evidence FOREIGN KEY (evidence_file_id) REFERENCES uploaded_files (id) ON DELETE SET NULL,
    CONSTRAINT fk_emergency_admin FOREIGN KEY (reviewed_by_admin_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_emergency_owner_status (owner_id, status),
    INDEX idx_emergency_beneficiary_status (beneficiary_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Verification Records Table
CREATE TABLE verification_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    beneficiary_id BIGINT NOT NULL,
    verifier_admin_id BIGINT NULL,
    verification_type VARCHAR(50) NOT NULL,
    document_file_id BIGINT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT NULL,
    verified_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_verification_beneficiary FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries (id) ON DELETE CASCADE,
    CONSTRAINT fk_verification_admin FOREIGN KEY (verifier_admin_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_verification_doc FOREIGN KEY (document_file_id) REFERENCES uploaded_files (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Notifications Table
CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('SYSTEM', 'ASSET', 'BENEFICIARY', 'PERMISSION', 'EMERGENCY_REQUEST', 'SECURITY') NOT NULL DEFAULT 'SYSTEM',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_notifications_user_read (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Activity Logs Table
CREATE TABLE activity_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    action VARCHAR(100) NOT NULL,
    description VARCHAR(500) NOT NULL,
    ip_address VARCHAR(50) NULL,
    user_agent VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activity_logs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_activity_logs_user (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Admin Audit Logs Table
CREATE TABLE admin_audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    admin_id BIGINT NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_entity VARCHAR(50) NOT NULL,
    target_id BIGINT NOT NULL,
    details TEXT NULL,
    ip_address VARCHAR(50) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_admin_audit_admin FOREIGN KEY (admin_id) REFERENCES users (id) ON DELETE RESTRICT,
    INDEX idx_admin_audit_lookup (admin_id, action),
    INDEX idx_admin_audit_target (target_entity, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. System Settings Table
CREATE TABLE system_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description VARCHAR(255) NULL,
    updated_by_admin_id BIGINT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_system_settings_admin FOREIGN KEY (updated_by_admin_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Administrator Permissions Table
CREATE TABLE administrator_permissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    admin_id BIGINT NOT NULL,
    permission_name VARCHAR(100) NOT NULL,
    granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_admin_permissions_admin FOREIGN KEY (admin_id) REFERENCES users (id) ON DELETE CASCADE,
    UNIQUE KEY uk_admin_permission (admin_id, permission_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- SEED DATA
-- =============================================================================

INSERT INTO asset_categories (name, code, description, icon, is_active) VALUES
('Social Media Accounts', 'SOCIAL_MEDIA', 'Facebook, Instagram, LinkedIn, X/Twitter, YouTube accounts', 'bi-share-fill', TRUE),
('Email Accounts', 'EMAIL', 'Google, Outlook, Yahoo, and private custom email servers', 'bi-envelope-at-fill', TRUE),
('Financial & Banking References', 'FINANCIAL', 'Bank accounts, investment brokerages, and insurance policy references', 'bi-bank2', TRUE),
('Cryptocurrency Wallets', 'CRYPTO', 'Hardware wallets, seed phrase backups, and exchange references', 'bi-currency-bitcoin', TRUE),
('Domain Names', 'DOMAIN', 'Registrars, DNS managers, and domain name portfolios', 'bi-globe2', TRUE),
('Websites & Servers', 'WEBSITE', 'Web hosting accounts, VPS servers, and cloud console logins', 'bi-hdd-network-fill', TRUE),
('Cloud Storage & Backups', 'CLOUD_STORAGE', 'Google Drive, Dropbox, OneDrive, iCloud storage spaces', 'bi-cloud-check-fill', TRUE),
('Personal & Legal Documents', 'PERSONAL_DOCUMENTS', 'Wills, deeds, birth certificates, property titles, contracts', 'bi-file-earmark-lock2-fill', TRUE),
('Photos & Media Vaults', 'MEDIA', 'Family photo archives, video libraries, and digital collections', 'bi-camera-reels-fill', TRUE),
('Business & Intellectual Property', 'BUSINESS', 'Patents, copyright certificates, company ownership documentation', 'bi-briefcase-fill', TRUE),
('Other Digital Assets', 'OTHER', 'Miscellaneous digital assets and private custom instructions', 'bi-box-seam-fill', TRUE);

INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('PLATFORM_NAME', 'Digital Legacy Manager', 'Official platform display name'),
('MAX_UPLOAD_SIZE_MB', '25', 'Maximum permissible file upload size per supporting document'),
('ALLOWED_FILE_EXTENSIONS', 'pdf,jpg,jpeg,png,doc,docx', 'Permitted file upload MIME extension list'),
('EMERGENCY_WAITING_PERIOD_DAYS', '7', 'Default cooldown waiting period for emergency access verification'),
('MAINTENANCE_MODE', 'false', 'Platform maintenance flag');

-- Default Platform Administrator
-- Email: admin@digitallegacy.com
-- Password: Admin@12345
INSERT INTO users (id, email, password, role, status, failed_login_attempts) VALUES
(1, 'admin@digitallegacy.com', '$2a$12$VdCuu9sHve576X7u0CdpkeyHmTkVZjWOyUBoaHtBCqYZCRO6DmtJ6', 'ADMIN', 'ACTIVE', 0);

INSERT INTO user_profiles (user_id, full_name, phone_number, email_verified, phone_verified) VALUES
(1, 'Master Administrator', '+1-800-555-0199', TRUE, TRUE);

INSERT INTO administrator_permissions (admin_id, permission_name) VALUES
(1, 'SUPER_ADMIN'),
(1, 'MANAGE_USERS'),
(1, 'MANAGE_ASSETS'),
(1, 'MANAGE_BENEFICIARIES'),
(1, 'REVIEW_EMERGENCY_REQUESTS'),
(1, 'VERIFY_IDENTITIES'),
(1, 'VIEW_AUDIT_LOGS'),
(1, 'SYSTEM_SETTINGS');
