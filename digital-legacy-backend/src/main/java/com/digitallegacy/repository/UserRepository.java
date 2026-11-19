package com.digitallegacy.repository;

import com.digitallegacy.entity.User;
import com.digitallegacy.entity.enums.Role;
import com.digitallegacy.entity.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    long countByStatus(UserStatus status);

    long countByRole(Role role);

    Page<User> findByRole(Role role, Pageable pageable);

    Page<User> findByStatus(UserStatus status, Pageable pageable);

    Page<User> findByEmailContainingIgnoreCase(String query, Pageable pageable);

    List<User> findTop10ByOrderByCreatedAtDesc();
}
