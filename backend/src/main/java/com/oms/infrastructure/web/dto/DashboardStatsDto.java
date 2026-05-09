package com.oms.infrastructure.web.dto;

import com.oms.domain.model.OrderStatus;

import java.math.BigDecimal;
import java.util.Map;

public record DashboardStatsDto(
        long totalOrders,
        Map<OrderStatus, Long> ordersByStatus,
        BigDecimal totalRevenue
) {}