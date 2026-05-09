package com.oms.infrastructure.persistence.specification;

import com.oms.domain.model.OrderStatus;
import com.oms.domain.port.OrderFilter;
import com.oms.infrastructure.persistence.entity.OrderJpaEntity;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;

public final class OrderSpecification {

    private OrderSpecification() {
        // utility class — no instantiation
    }

    public static Specification<OrderJpaEntity> hasStatus(OrderStatus status) {
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<OrderJpaEntity> createdAfter(LocalDate date) {
        return (root, query, cb) ->
                cb.greaterThanOrEqualTo(root.get("createdAt"), date.atStartOfDay());
    }

    public static Specification<OrderJpaEntity> createdBefore(LocalDate date) {
        return (root, query, cb) ->
                cb.lessThan(root.get("createdAt"), date.plusDays(1).atStartOfDay());
    }

    public static Specification<OrderJpaEntity> customerNameContains(String name) {
        return (root, query, cb) ->
                cb.like(cb.lower(root.get("customer").get("name")), "%" + name.toLowerCase() + "%");
    }

    public static Specification<OrderJpaEntity> fromFilter(OrderFilter filter) {
        Specification<OrderJpaEntity> spec = Specification.where(null);

        if (filter.status() != null) {
            spec = spec.and(hasStatus(filter.status()));
        }
        if (filter.dateFrom() != null) {
            spec = spec.and(createdAfter(filter.dateFrom()));
        }
        if (filter.dateTo() != null) {
            spec = spec.and(createdBefore(filter.dateTo()));
        }
        if (filter.customerName() != null && !filter.customerName().isBlank()) {
            spec = spec.and(customerNameContains(filter.customerName()));
        }

        return spec;
    }
}
