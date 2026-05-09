package com.oms.infrastructure.web.dto;

import com.oms.domain.model.OrderStatus;

import java.math.BigDecimal;

public record UpdateOrderRequest(
        OrderStatus status,
        BigDecimal total
) {}
