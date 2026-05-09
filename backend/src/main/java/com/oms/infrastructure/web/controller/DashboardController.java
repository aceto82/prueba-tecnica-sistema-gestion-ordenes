package com.oms.infrastructure.web.controller;

import com.oms.domain.model.OrderStatus;
import com.oms.infrastructure.persistence.repository.OrderJpaRepository;
import com.oms.infrastructure.web.dto.DashboardStatsDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final OrderJpaRepository orderJpaRepository;

    public DashboardController(OrderJpaRepository orderJpaRepository) {
        this.orderJpaRepository = orderJpaRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDto> getStats() {
        long totalOrders = orderJpaRepository.count();

        // Build orders by status map (maintains insertion order for display)
        var ordersByStatus = new LinkedHashMap<OrderStatus, Long>();
        for (OrderStatus status : OrderStatus.values()) {
            long count = orderJpaRepository.countByStatus(status);
            ordersByStatus.put(status, count);
        }

        var totalRevenue = orderJpaRepository.sumTotal();
        if (totalRevenue == null) {
            totalRevenue = java.math.BigDecimal.ZERO;
        }

        return ResponseEntity.ok(new DashboardStatsDto(totalOrders, ordersByStatus, totalRevenue));
    }
}