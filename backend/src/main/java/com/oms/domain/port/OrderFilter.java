package com.oms.domain.port;

import com.oms.domain.model.OrderStatus;

import java.time.LocalDate;

public record OrderFilter(
        OrderStatus status,
        LocalDate dateFrom,
        LocalDate dateTo,
        String customerName
) {}
