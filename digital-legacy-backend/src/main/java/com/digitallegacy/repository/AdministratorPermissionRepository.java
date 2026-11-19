package com.digitallegacy.repository;

import com.digitallegacy.entity.AdministratorPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdministratorPermissionRepository extends JpaRepository<AdministratorPermission, Long> {

    List<AdministratorPermission> findByAdminId(Long adminId);

    boolean existsByAdminIdAndPermissionName(Long adminId, String permissionName);
}
