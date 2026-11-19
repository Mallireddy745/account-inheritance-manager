package com.digitallegacy;

import com.digitallegacy.dto.request.LoginRequest;
import com.digitallegacy.dto.request.RegisterRequest;
import com.digitallegacy.entity.User;
import com.digitallegacy.entity.enums.UserStatus;
import com.digitallegacy.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
public class AdminPanelIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    private String adminToken;
    private String normalUserToken;
    private Long testUserId;

    @BeforeEach
    void setup() throws Exception {
        userRepository.findByEmail("test.target.user@example.com").ifPresent(userRepository::delete);

        // 1. Authenticate seeded Admin
        LoginRequest adminLogin = LoginRequest.builder()
                .email("admin@digitallegacy.com")
                .password("Admin@12345")
                .build();

        MvcResult adminRes = mockMvc.perform(post("/api/auth/admin-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode adminJson = objectMapper.readTree(adminRes.getResponse().getContentAsString());
        adminToken = adminJson.get("data").get("token").asText();
        assertNotNull(adminToken);

        // 2. Register normal user
        RegisterRequest userRegister = RegisterRequest.builder()
                .fullName("Test Target User")
                .email("test.target.user@example.com")
                .password("Password@123")
                .confirmPassword("Password@123")
                .phoneNumber("+1234567890")
                .termsConsent(true)
                .build();

        MvcResult userRes = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userRegister)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode userJson = objectMapper.readTree(userRes.getResponse().getContentAsString());
        normalUserToken = userJson.get("data").get("token").asText();
        testUserId = userJson.get("data").get("userId").asLong();
        assertNotNull(normalUserToken);
        assertNotNull(testUserId);
    }

    @Test
    void testAdminDashboardMetrics() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalUsers").isNumber())
                .andExpect(jsonPath("$.data.activeUsers").isNumber())
                .andExpect(jsonPath("$.data.categoryDistribution").isMap());
    }

    @Test
    void testNonAdminForbiddenFromAdminEndpoints() throws Exception {
        // Normal user attempts to view admin dashboard -> 403 Forbidden
        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", "Bearer " + normalUserToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testAdminUserStatusManagement() throws Exception {
        // 1. Admin gets all users
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray());

        // 2. Admin suspends target user
        mockMvc.perform(patch("/api/admin/users/" + testUserId + "/status")
                        .param("status", "SUSPENDED")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("SUSPENDED"));

        // Verify status in repository
        User updated = userRepository.findById(testUserId).orElseThrow();
        assertEquals(UserStatus.SUSPENDED, updated.getStatus());

        // Suspended user attempting to access user endpoint -> 401 or 403 (suspended)
        mockMvc.perform(get("/api/users/profile")
                        .header("Authorization", "Bearer " + normalUserToken))
                .andExpect(status().isUnauthorized());

        // 3. Admin reactivates user
        mockMvc.perform(patch("/api/admin/users/" + testUserId + "/status")
                        .param("status", "ACTIVE")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));
    }

    @Test
    void testAdminAuditLogsGenerated() throws Exception {
        // Perform an admin status change
        mockMvc.perform(patch("/api/admin/users/" + testUserId + "/status")
                        .param("status", "INACTIVE")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // Fetch audit logs
        mockMvc.perform(get("/api/admin/audit-logs")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.content[0].action").exists());
    }
}
