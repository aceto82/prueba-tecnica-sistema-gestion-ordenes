package com.oms.infrastructure.web.dto;

import com.oms.domain.model.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OrderResponse(
        Long id,
        OrderStatus status,
        BigDecimal total,
        LocalDateTime createdAt,
        CustomerSummaryDto customer
) {}
