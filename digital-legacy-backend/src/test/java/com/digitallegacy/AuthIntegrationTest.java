package com.digitallegacy;

import com.digitallegacy.dto.request.LoginRequest;
import com.digitallegacy.dto.request.RegisterRequest;
import com.digitallegacy.entity.User;
import com.digitallegacy.entity.enums.Role;
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
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
public class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    private final String testEmail = "john.doe@example.com";

    @BeforeEach
    void setup() {
        // Clean up test user if present
        userRepository.findByEmail(testEmail).ifPresent(userRepository::delete);
    }

    @Test
    void testUserRegistrationAndDuplicateRejection() throws Exception {
        RegisterRequest registerReq = RegisterRequest.builder()
                .fullName("John Doe")
                .email(testEmail)
                .phoneNumber("+1-555-0100")
                .password("Password@123")
                .confirmPassword("Password@123")
                .termsConsent(true)
                .build();

        // 1. Successful Registration
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value(testEmail))
                .andExpect(jsonPath("$.data.role").value("OWNER"))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andReturn();

        // Verify Database Record
        User createdUser = userRepository.findByEmail(testEmail).orElse(null);
        assertNotNull(createdUser);
        assertEquals(Role.OWNER, createdUser.getRole());
        assertEquals("John Doe", createdUser.getProfile().getFullName());

        // 2. Duplicate Registration Rejection (409 Conflict)
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testUserLoginSuccessAndInvalidCredentials() throws Exception {
        // First register the user
        RegisterRequest registerReq = RegisterRequest.builder()
                .fullName("John Doe")
                .email(testEmail)
                .phoneNumber("+1-555-0100")
                .password("Password@123")
                .confirmPassword("Password@123")
                .termsConsent(true)
                .build();

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated());

        // Valid Login
        LoginRequest validLogin = LoginRequest.builder()
                .email(testEmail)
                .password("Password@123")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.role").value("OWNER"));

        // Invalid Password
        LoginRequest invalidLogin = LoginRequest.builder()
                .email(testEmail)
                .password("WrongPassword123")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidLogin)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testAdminLoginSuccessAndNonAdminRejection() throws Exception {
        // 1. Admin login with provisioned seed admin
        LoginRequest adminLogin = LoginRequest.builder()
                .email("admin@digitallegacy.com")
                .password("Admin@12345")
                .build();

        MvcResult adminResult = mockMvc.perform(post("/api/auth/admin-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.role").value("ADMIN"))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andReturn();

        // 2. Regular user trying to login via /api/auth/admin-login should be rejected
        RegisterRequest registerReq = RegisterRequest.builder()
                .fullName("Regular User")
                .email("regular.user@example.com")
                .password("Password@123")
                .confirmPassword("Password@123")
                .termsConsent(true)
                .build();

        userRepository.findByEmail("regular.user@example.com").ifPresent(userRepository::delete);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated());

        LoginRequest regularUserAdminAttempt = LoginRequest.builder()
                .email("regular.user@example.com")
                .password("Password@123")
                .build();

        mockMvc.perform(post("/api/auth/admin-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regularUserAdminAttempt)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testProtectedMeEndpointWithAndWithoutToken() throws Exception {
        // Without Token -> 401 Unauthorized
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());

        // With Token -> 200 OK
        LoginRequest adminLogin = LoginRequest.builder()
                .email("admin@digitallegacy.com")
                .password("Admin@12345")
                .build();

        MvcResult loginResult = mockMvc.perform(post("/api/auth/admin-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = loginResult.getResponse().getContentAsString();
        JsonNode jsonNode = objectMapper.readTree(responseBody);
        String token = jsonNode.get("data").get("token").asText();

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("admin@digitallegacy.com"))
                .andExpect(jsonPath("$.data.fullName").value("Master Administrator"));
    }
}
