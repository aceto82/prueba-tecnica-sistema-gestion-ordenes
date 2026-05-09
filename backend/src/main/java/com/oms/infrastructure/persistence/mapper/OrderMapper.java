package com.oms.infrastructure.persistence.mapper;

import com.oms.domain.model.Order;
import com.oms.infrastructure.persistence.entity.CustomerJpaEntity;
import com.oms.infrastructure.persistence.entity.OrderJpaEntity;

public final class OrderMapper {

    private OrderMapper() {
        // utility class — no instantiation
    }

    public static Order toDomain(OrderJpaEntity entity) {
        if (entity == null) return null;
        return Order.rehydrate(
                entity.getId(),
                entity.getStatus(),
                entity.getTotal(),
                entity.getCreatedAt(),
                entity.getCustomer().getId()
        );
    }

    public static OrderJpaEntity toJpa(Order order) {
        if (order == null) return null;
        OrderJpaEntity entity = new OrderJpaEntity();
        entity.setId(order.getId());
        entity.setStatus(order.getStatus());
        entity.setTotal(order.getTotal());
        entity.setCreatedAt(order.getCreatedAt());
        // Set customer reference by id only — avoids an extra SELECT on save
        CustomerJpaEntity customerRef = new CustomerJpaEntity();
        customerRef.setId(order.getCustomerId());
        entity.setCustomer(customerRef);
        return entity;
    }
}
