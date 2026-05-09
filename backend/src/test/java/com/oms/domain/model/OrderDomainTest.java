package com.oms.domain.model;

import com.oms.domain.exception.InvalidStatusTransitionException;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OrderDomainTest {

    private Order pendingOrder() {
        return Order.rehydrate(1L, OrderStatus.PENDING, BigDecimal.TEN, LocalDateTime.now(), 1L);
    }

    private Order processingOrder() {
        return Order.rehydrate(2L, OrderStatus.PROCESSING, BigDecimal.TEN, LocalDateTime.now(), 1L);
    }

    private Order completedOrder() {
        return Order.rehydrate(3L, OrderStatus.COMPLETED, BigDecimal.TEN, LocalDateTime.now(), 1L);
    }

    private Order cancelledOrder() {
        return Order.rehydrate(4L, OrderStatus.CANCELLED, BigDecimal.TEN, LocalDateTime.now(), 1L);
    }

    // ---- Valid transitions ----

    @Test
    void pendingToProcessing_isValid() {
        Order order = pendingOrder();
        order.transitionTo(OrderStatus.PROCESSING);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.PROCESSING);
    }

    @Test
    void pendingToCancelled_isValid() {
        Order order = pendingOrder();
        order.transitionTo(OrderStatus.CANCELLED);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELLED);
    }

    @Test
    void processingToCompleted_isValid() {
        Order order = processingOrder();
        order.transitionTo(OrderStatus.COMPLETED);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.COMPLETED);
    }

    @Test
    void processingToCancelled_isValid() {
        Order order = processingOrder();
        order.transitionTo(OrderStatus.CANCELLED);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELLED);
    }

    // ---- Invalid transitions ----

    @Test
    void pendingToCompleted_throws() {
        Order order = pendingOrder();
        assertThatThrownBy(() -> order.transitionTo(OrderStatus.COMPLETED))
                .isInstanceOf(InvalidStatusTransitionException.class)
                .hasMessageContaining("PENDING")
                .hasMessageContaining("COMPLETED");
    }

    @Test
    void pendingToPending_throws() {
        Order order = pendingOrder();
        assertThatThrownBy(() -> order.transitionTo(OrderStatus.PENDING))
                .isInstanceOf(InvalidStatusTransitionException.class);
    }

    @Test
    void processingToPending_throws() {
        Order order = processingOrder();
        assertThatThrownBy(() -> order.transitionTo(OrderStatus.PENDING))
                .isInstanceOf(InvalidStatusTransitionException.class);
    }

    @Test
    void processingToProcessing_throws() {
        Order order = processingOrder();
        assertThatThrownBy(() -> order.transitionTo(OrderStatus.PROCESSING))
                .isInstanceOf(InvalidStatusTransitionException.class);
    }

    @Test
    void completedToPending_throws() {
        Order order = completedOrder();
        assertThatThrownBy(() -> order.transitionTo(OrderStatus.PENDING))
                .isInstanceOf(InvalidStatusTransitionException.class);
    }

    @Test
    void completedToProcessing_throws() {
        Order order = completedOrder();
        assertThatThrownBy(() -> order.transitionTo(OrderStatus.PROCESSING))
                .isInstanceOf(InvalidStatusTransitionException.class);
    }

    @Test
    void completedToCancelled_throws() {
        Order order = completedOrder();
        assertThatThrownBy(() -> order.transitionTo(OrderStatus.CANCELLED))
                .isInstanceOf(InvalidStatusTransitionException.class);
    }

    @Test
    void cancelledToPending_throws() {
        Order order = cancelledOrder();
        assertThatThrownBy(() -> order.transitionTo(OrderStatus.PENDING))
                .isInstanceOf(InvalidStatusTransitionException.class);
    }

    @Test
    void cancelledToProcessing_throws() {
        Order order = cancelledOrder();
        assertThatThrownBy(() -> order.transitionTo(OrderStatus.PROCESSING))
                .isInstanceOf(InvalidStatusTransitionException.class);
    }

    @Test
    void cancelledToCompleted_throws() {
        Order order = cancelledOrder();
        assertThatThrownBy(() -> order.transitionTo(OrderStatus.COMPLETED))
                .isInstanceOf(InvalidStatusTransitionException.class);
    }
}
