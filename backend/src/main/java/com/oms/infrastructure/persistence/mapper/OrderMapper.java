package com.oms.infrastructure.persistence.mapper;

import com.oms.domain.model.Order;
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
                entity.getCustomerId()
        );
    }

    public static OrderJpaEntity toJpa(Order order) {
        if (order == null) return null;
        return new OrderJpaEntity(
                order.getId(),
                order.getStatus(),
                order.getTotal(),
                order.getCreatedAt(),
                order.getCustomerId()
        );
    }
}
