package com.oms.application.service;

import com.oms.domain.exception.InvalidStatusTransitionException;
import com.oms.domain.model.Customer;
import com.oms.domain.model.Order;
import com.oms.domain.model.OrderStatus;
import com.oms.domain.port.CustomerRepository;
import com.oms.domain.port.OrderRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private CustomerRepository customerRepository;

    @InjectMocks
    private OrderService orderService;

    private Customer alice() {
        return Customer.rehydrate(1L, "Alice", "alice@example.com");
    }

    private Order pendingOrder() {
        return Order.rehydrate(10L, OrderStatus.PENDING, new BigDecimal("100.00"), LocalDateTime.now(), 1L);
    }

    private Order processingOrder() {
        return Order.rehydrate(11L, OrderStatus.PROCESSING, new BigDecimal("100.00"), LocalDateTime.now(), 1L);
    }

    @Test
    void createOrder_withValidCustomer_returnsPendingOrder() {
        when(customerRepository.findById(1L)).thenReturn(Optional.of(alice()));
        Order saved = Order.rehydrate(10L, OrderStatus.PENDING, new BigDecimal("150.00"), LocalDateTime.now(), 1L);
        when(orderRepository.save(any())).thenReturn(saved);

        Order result = orderService.createOrder(1L, new BigDecimal("150.00"));

        assertThat(result.getStatus()).isEqualTo(OrderStatus.PENDING);
        assertThat(result.getCustomerId()).isEqualTo(1L);
        verify(orderRepository).save(any());
    }

    @Test
    void createOrder_withInvalidCustomer_throwsEntityNotFoundException() {
        when(customerRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.createOrder(99L, new BigDecimal("100.00")))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void transitionOrderStatus_validTransition_updatesStatus() {
        Order pending = pendingOrder();
        Order processing = Order.rehydrate(10L, OrderStatus.PROCESSING, new BigDecimal("100.00"), LocalDateTime.now(), 1L);
        when(orderRepository.findById(10L)).thenReturn(Optional.of(pending));
        when(orderRepository.save(any())).thenReturn(processing);

        Order result = orderService.transitionOrderStatus(10L, OrderStatus.PROCESSING);

        assertThat(result.getStatus()).isEqualTo(OrderStatus.PROCESSING);
        verify(orderRepository).save(any());
    }

    @Test
    void transitionOrderStatus_invalidTransition_throwsInvalidStatusTransitionException() {
        Order completed = Order.rehydrate(12L, OrderStatus.COMPLETED, BigDecimal.TEN, LocalDateTime.now(), 1L);
        when(orderRepository.findById(12L)).thenReturn(Optional.of(completed));

        assertThatThrownBy(() -> orderService.transitionOrderStatus(12L, OrderStatus.PENDING))
                .isInstanceOf(InvalidStatusTransitionException.class);
    }

    @Test
    void updateOrderDetails_onPendingOrder_updatesTotal() {
        Order pending = pendingOrder();
        Order updated = Order.rehydrate(10L, OrderStatus.PENDING, new BigDecimal("250.00"), LocalDateTime.now(), 1L);
        when(orderRepository.findById(10L)).thenReturn(Optional.of(pending));
        when(orderRepository.save(any())).thenReturn(updated);

        Order result = orderService.updateOrderDetails(10L, new BigDecimal("250.00"));

        assertThat(result.getTotal()).isEqualByComparingTo("250.00");
        verify(orderRepository).save(any());
    }

    @Test
    void updateOrderDetails_onNonPendingOrder_throwsException() {
        Order processing = processingOrder();
        when(orderRepository.findById(11L)).thenReturn(Optional.of(processing));

        assertThatThrownBy(() -> orderService.updateOrderDetails(11L, new BigDecimal("250.00")))
                .isInstanceOf(IllegalStateException.class);
    }
}
