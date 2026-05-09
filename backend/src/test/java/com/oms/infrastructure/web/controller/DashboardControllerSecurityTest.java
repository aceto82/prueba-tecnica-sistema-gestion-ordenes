package com.oms.infrastructure.web.controller;

import com.oms.config.SecurityConfig;
import com.oms.domain.model.OrderStatus;
import com.oms.infrastructure.persistence.repository.OrderJpaRepository;
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

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Security-focused @WebMvcTest for DashboardController.
 * Validates 401 (no token) and confirms USER role can access stats.
 */
@WebMvcTest(
        value = DashboardController.class,
        excludeAutoConfiguration = {
                org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration.class
        }
)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class DashboardControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private OrderJpaRepository orderJpaRepository;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private UserDetailsServiceImpl userDetailsService;

    // --- Scenario: 401 without authentication ---

    @Test
    void getStats_withoutAuthentication_returns401() throws Exception {
        mockMvc.perform(get("/api/dashboard/stats")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    // --- Scenario: authenticated USER can access dashboard stats ---

    @Test
    @WithMockUser(roles = "USER")
    void getStats_withUserRole_returns200() throws Exception {
        when(orderJpaRepository.count()).thenReturn(3L);
        when(orderJpaRepository.countByStatus(any(OrderStatus.class))).thenReturn(1L);
        when(orderJpaRepository.sumTotal()).thenReturn(new BigDecimal("300.00"));

        mockMvc.perform(get("/api/dashboard/stats")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }
}
