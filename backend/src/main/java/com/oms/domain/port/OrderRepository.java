package com.oms.domain.port;

import com.oms.domain.model.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface OrderRepository {

    Optional<Order> findById(Long id);

    Page<Order> findAll(Pageable pageable);

    Page<Order> findAll(OrderFilter filter, Pageable pageable);

    Order save(Order order);

    boolean existsById(Long id);
}
