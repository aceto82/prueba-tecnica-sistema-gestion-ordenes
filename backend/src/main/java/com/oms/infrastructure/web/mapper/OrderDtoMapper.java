package com.oms.infrastructure.web.mapper;

import com.oms.domain.model.Customer;
import com.oms.domain.model.Order;
import com.oms.infrastructure.web.dto.CustomerSummaryDto;
import com.oms.infrastructure.web.dto.OrderResponse;

public class OrderDtoMapper {

    private OrderDtoMapper() {}

    public static OrderResponse toResponse(Order order, Customer customer) {
        return new OrderResponse(
                order.getId(),
                order.getStatus(),
                order.getTotal(),
                order.getCreatedAt(),
                new CustomerSummaryDto(customer.getId(), customer.getName())
        );
    }
}
