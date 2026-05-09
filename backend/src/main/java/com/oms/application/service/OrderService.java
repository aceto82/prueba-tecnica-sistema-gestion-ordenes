package com.oms.application.service;

import com.oms.domain.model.Order;
import com.oms.domain.model.OrderStatus;
import com.oms.domain.port.CustomerRepository;
import com.oms.domain.port.OrderFilter;
import com.oms.domain.port.OrderRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;

    public OrderService(OrderRepository orderRepository, CustomerRepository customerRepository) {
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
    }

    public Page<Order> listOrders(OrderFilter filter, Pageable pageable) {
        return orderRepository.findAll(filter, pageable);
    }

    public Page<Order> listOrders(OrderFilter filter, Pageable pageable, String username) {
        return orderRepository.findAll(filter, pageable, username);
    }

    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Order not found with id: " + id));
    }

    public Order createOrder(Long customerId, BigDecimal total) {
        customerRepository.findById(customerId)
                .orElseThrow(() -> new EntityNotFoundException("Customer not found with id: " + customerId));
        Order order = Order.create(OrderStatus.PENDING, total, customerId);
        return orderRepository.save(order);
    }

    public Order updateOrderDetails(Long id, BigDecimal total) {
        Order order = getOrderById(id);
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalStateException(
                    "Cannot update total of order in status " + order.getStatus() + ". Only PENDING orders can be updated.");
        }
        order.setTotal(total);
        return orderRepository.save(order);
    }

    public Order transitionOrderStatus(Long id, OrderStatus newStatus) {
        Order order = getOrderById(id);
        order.transitionTo(newStatus);
        return orderRepository.save(order);
    }
}
