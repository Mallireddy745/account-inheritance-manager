package com.digitallegacy;

import com.digitallegacy.entity.AssetCategory;
import com.digitallegacy.entity.User;
import com.digitallegacy.entity.enums.Role;
import com.digitallegacy.repository.AssetCategoryRepository;
import com.digitallegacy.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
public class ApplicationContextTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AssetCategoryRepository assetCategoryRepository;

    @Test
    @Transactional
    void testUserRepositoryAndMasterAdmin() {
        Optional<User> adminOpt = userRepository.findByEmail("admin@digitallegacy.com");
        assertTrue(adminOpt.isPresent(), "Admin user must exist in MySQL");
        User admin = adminOpt.get();
        assertEquals(Role.ADMIN, admin.getRole());
        assertNotNull(admin.getProfile(), "Admin profile must be attached");
        assertEquals("Master Administrator", admin.getProfile().getFullName());
        System.out.println("Verified User Entity & Repository: Admin found with ID " + admin.getId());
    }

    @Test
    void testAssetCategoriesSeeded() {
        List<AssetCategory> categories = assetCategoryRepository.findByIsActiveTrue();
        assertFalse(categories.isEmpty(), "Active asset categories should not be empty");
        assertTrue(categories.size() >= 11, "Should have at least 11 seeded asset categories");
        System.out.println("Verified AssetCategory Entity & Repository: " + categories.size() + " active categories loaded");
    }
}
