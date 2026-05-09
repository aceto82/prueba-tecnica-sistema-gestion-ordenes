package com.oms.domain.model;

import com.oms.domain.exception.InvalidStatusTransitionException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;

public class Order {

    private Long id;
    private OrderStatus status;
    private BigDecimal total;
    private LocalDateTime createdAt;
    private Long customerId;

    Order(Long id, OrderStatus status, BigDecimal total, LocalDateTime createdAt, Long customerId) {
        this.id = id;
        this.status = status;
        this.total = total;
        this.createdAt = createdAt;
        this.customerId = customerId;
    }

    public static Order create(OrderStatus status, BigDecimal total, Long customerId) {
        return new Order(null, status, total, LocalDateTime.now(), customerId);
    }

    public static Order rehydrate(Long id, OrderStatus status, BigDecimal total, LocalDateTime createdAt, Long customerId) {
        return new Order(id, status, total, createdAt, customerId);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public void transitionTo(OrderStatus next) {
        boolean valid = switch (this.status) {
            case PENDING -> next == OrderStatus.PROCESSING || next == OrderStatus.CANCELLED;
            case PROCESSING -> next == OrderStatus.COMPLETED || next == OrderStatus.CANCELLED;
            default -> false;
        };
        if (!valid) throw new InvalidStatusTransitionException(this.status, next);
        this.status = next;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Order order)) return false;
        return Objects.equals(id, order.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }

    @Override
    public String toString() {
        return "Order{id=" + id + ", status=" + status + ", total=" + total + ", customerId=" + customerId + "}";
    }
}
