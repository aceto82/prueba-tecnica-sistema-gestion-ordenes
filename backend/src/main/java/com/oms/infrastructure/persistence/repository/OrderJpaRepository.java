package com.oms.infrastructure.persistence.repository;

import com.oms.infrastructure.persistence.entity.OrderJpaEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

@Repository
public interface OrderJpaRepository extends JpaRepository<OrderJpaEntity, Long>,
        JpaSpecificationExecutor<OrderJpaEntity> {

    @EntityGraph(value = "order.customer")
    Page<OrderJpaEntity> findAll(Specification<OrderJpaEntity> spec, Pageable pageable);

    @EntityGraph(value = "order.customer")
    Page<OrderJpaEntity> findAll(Pageable pageable);

    long count();

    long countByStatus(com.oms.domain.model.OrderStatus status);

    @Query("SELECT COALESCE(SUM(o.total), 0) FROM OrderJpaEntity o")
    BigDecimal sumTotal();

    @Query("SELECT COALESCE(SUM(o.total), 0) FROM OrderJpaEntity o WHERE o.status = :status")
    BigDecimal sumTotalByStatus(com.oms.domain.model.OrderStatus status);
}
