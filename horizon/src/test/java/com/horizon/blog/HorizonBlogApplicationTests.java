package com.horizon.blog;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.horizon.blog.model.entity.Category;
import com.horizon.blog.repository.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class HorizonBlogApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CategoryRepository categoryRepository;

    @BeforeEach
    void setUp() {
        if (!categoryRepository.existsBySlug("technology")) {
            categoryRepository.save(Category.builder()
                    .name("Technology")
                    .slug("technology")
                    .icon("cpu")
                    .storyCount(0)
                    .build());
        }
    }

    @Test
    void actuatorHealthShouldBePublic() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void registerLoginRefreshAndProtectedPostCreationFlowShouldWork() throws Exception {
        String registerPayload = """
                {
                  "username": "testwriter",
                  "email": "writer@example.com",
                  "password": "SecurePass123",
                  "displayName": "Test Writer"
                }
                """;

        String registerResponse = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode registerJson = objectMapper.readTree(registerResponse);
        String accessToken = registerJson.get("token").asText();
        String refreshToken = registerJson.get("refreshToken").asText();

        String meResponse = mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("testwriter"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        assertThat(objectMapper.readTree(meResponse).get("email").asText()).isEqualTo("writer@example.com");

        String loginPayload = """
                {
                  "email": "writer@example.com",
                  "password": "SecurePass123"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty());

        String refreshPayload = """
                {
                  "refreshToken": "%s"
                }
                """.formatted(refreshToken);

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(refreshPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty());
    }

    @Test
    void creatingPostWithoutAuthenticationShouldBeRejected() throws Exception {
        String createPostPayload = """
                {
                  "title": "Unauthorized Story",
                  "subtitle": "Should fail",
                  "body": "This request should not be allowed without authentication.",
                  "categorySlug": "technology",
                  "tags": ["security"],
                  "status": "PUBLISHED",
                  "visibility": "PUBLIC"
                }
                """;

        mockMvc.perform(post("/api/posts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createPostPayload))
                .andExpect(status().isForbidden());
    }
}
