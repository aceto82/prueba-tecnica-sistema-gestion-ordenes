package com.oms.infrastructure.persistence;

import com.oms.domain.model.Order;
import com.oms.domain.port.OrderFilter;
import com.oms.domain.port.OrderRepository;
import com.oms.infrastructure.persistence.mapper.OrderMapper;
import com.oms.infrastructure.persistence.repository.OrderJpaRepository;
import com.oms.infrastructure.persistence.specification.OrderSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class OrderRepositoryAdapter implements OrderRepository {

    private final OrderJpaRepository jpaRepository;

    public OrderRepositoryAdapter(OrderJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Optional<Order> findById(Long id) {
        return jpaRepository.findById(id)
                .map(OrderMapper::toDomain);
    }

    @Override
    public Page<Order> findAll(Pageable pageable) {
        return jpaRepository.findAll(pageable)
                .map(OrderMapper::toDomain);
    }

    @Override
    public Page<Order> findAll(OrderFilter filter, Pageable pageable) {
        return jpaRepository.findAll(OrderSpecification.fromFilter(filter), pageable)
                .map(OrderMapper::toDomain);
    }

    @Override
    public Page<Order> findAll(OrderFilter filter, Pageable pageable, String username) {
        var spec = OrderSpecification.fromFilter(filter);
        if (username != null && !username.isBlank()) {
            spec = spec.and(OrderSpecification.byUserId(username));
        }
        return jpaRepository.findAll(spec, pageable)
                .map(OrderMapper::toDomain);
    }

    @Override
    public Order save(Order order) {
        return OrderMapper.toDomain(jpaRepository.save(OrderMapper.toJpa(order)));
    }

    @Override
    public boolean existsById(Long id) {
        return jpaRepository.existsById(id);
    }
}
