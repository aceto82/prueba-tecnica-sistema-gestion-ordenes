package com.oms.infrastructure.web.controller;

import com.oms.domain.model.OrderStatus;
import com.oms.infrastructure.persistence.repository.OrderJpaRepository;
import com.oms.infrastructure.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(value = DashboardController.class, excludeAutoConfiguration = {
        org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class,
        org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration.class,
        org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration.class
})
class DashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private OrderJpaRepository orderJpaRepository;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private UserDetailsService userDetailsService;

    // --- Scenario: GET /api/dashboard/stats returns 200 with stats payload ---

    @Test
    void getStats_returns200WithStatsPayload() throws Exception {
        when(orderJpaRepository.count()).thenReturn(5L);
        when(orderJpaRepository.countByStatus(OrderStatus.PENDING)).thenReturn(2L);
        when(orderJpaRepository.countByStatus(OrderStatus.PROCESSING)).thenReturn(1L);
        when(orderJpaRepository.countByStatus(OrderStatus.COMPLETED)).thenReturn(1L);
        when(orderJpaRepository.countByStatus(OrderStatus.CANCELLED)).thenReturn(1L);
        when(orderJpaRepository.sumTotal()).thenReturn(new BigDecimal("750.00"));

        mockMvc.perform(get("/api/dashboard/stats")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalOrders").value(5))
                .andExpect(jsonPath("$.totalRevenue").value(750.00));
    }

    // --- Scenario: stats return zero when no orders exist ---

    @Test
    void getStats_noOrders_returnsTotalsOfZero() throws Exception {
        when(orderJpaRepository.count()).thenReturn(0L);
        when(orderJpaRepository.countByStatus(any(OrderStatus.class))).thenReturn(0L);
        when(orderJpaRepository.sumTotal()).thenReturn(null); // null → should be coerced to 0

        mockMvc.perform(get("/api/dashboard/stats")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalOrders").value(0))
                .andExpect(jsonPath("$.totalRevenue").value(0));
    }

    // --- Scenario: status map is present in response ---

    @Test
    void getStats_responseIncludesOrdersByStatusMap() throws Exception {
        when(orderJpaRepository.count()).thenReturn(3L);
        when(orderJpaRepository.countByStatus(OrderStatus.PENDING)).thenReturn(3L);
        when(orderJpaRepository.countByStatus(OrderStatus.PROCESSING)).thenReturn(0L);
        when(orderJpaRepository.countByStatus(OrderStatus.COMPLETED)).thenReturn(0L);
        when(orderJpaRepository.countByStatus(OrderStatus.CANCELLED)).thenReturn(0L);
        when(orderJpaRepository.sumTotal()).thenReturn(new BigDecimal("300.00"));

        mockMvc.perform(get("/api/dashboard/stats")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ordersByStatus").isNotEmpty())
                .andExpect(jsonPath("$.ordersByStatus.PENDING").value(3));
    }
}
