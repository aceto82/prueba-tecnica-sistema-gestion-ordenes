package com.oms.infrastructure.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreateOrderRequest(
        @NotNull(message = "Customer ID is required") Long customerId,
        @NotNull @DecimalMin(value = "0.01", message = "Total must be greater than 0") BigDecimal total
) {}
