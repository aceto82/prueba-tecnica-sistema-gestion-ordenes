package com.oms.infrastructure.web.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.oms.application.service.CustomerService;
import com.oms.config.SecurityConfig;
import com.oms.infrastructure.security.JwtAuthenticationFilter;
import com.oms.infrastructure.security.JwtService;
import com.oms.infrastructure.security.UserDetailsServiceImpl;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Security-focused @WebMvcTest for CustomerController.
 * Validates 401 (unauthenticated), 403 (USER on ADMIN-only DELETE), and 400 (bad request).
 */
@WebMvcTest(
        value = CustomerController.class,
        excludeAutoConfiguration = {
                org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration.class
        }
)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class CustomerControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CustomerService customerService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private UserDetailsServiceImpl userDetailsService;

    // --- Scenario: 401 without authentication ---

    @Test
    void listCustomers_withoutAuthentication_returns401() throws Exception {
        mockMvc.perform(get("/api/customers")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    // --- Scenario: 403 for USER on ADMIN-only DELETE ---

    @Test
    @WithMockUser(roles = "USER")
    void deleteCustomer_withUserRole_returns403() throws Exception {
        mockMvc.perform(delete("/api/customers/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    // --- Scenario: 400 for invalid (blank name) body ---

    @Test
    @WithMockUser(roles = "USER")
    void createCustomer_withBlankName_returns400() throws Exception {
        mockMvc.perform(post("/api/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\",\"email\":\"a@b.com\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }
}
