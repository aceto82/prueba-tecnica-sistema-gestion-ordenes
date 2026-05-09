package com.oms.domain.port;

import com.oms.domain.model.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface OrderRepository {

    Optional<Order> findById(Long id);

    void deleteById(Long id);

    Page<Order> findAll(Pageable pageable);

    Page<Order> findAll(OrderFilter filter, Pageable pageable);

    Page<Order> findAll(OrderFilter filter, Pageable pageable, String username);

    Order save(Order order);

    boolean existsById(Long id);
}
