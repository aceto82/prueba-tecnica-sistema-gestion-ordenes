package com.oms.infrastructure.persistence;

import com.oms.domain.model.Customer;
import com.oms.domain.port.CustomerRepository;
import com.oms.infrastructure.persistence.mapper.CustomerMapper;
import com.oms.infrastructure.persistence.repository.CustomerJpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class CustomerRepositoryAdapter implements CustomerRepository {

    private final CustomerJpaRepository jpaRepository;

    public CustomerRepositoryAdapter(CustomerJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Optional<Customer> findById(Long id) {
        return jpaRepository.findById(id)
                .map(CustomerMapper::toDomain);
    }

    @Override
    public List<Customer> findAll() {
        return jpaRepository.findAll().stream()
                .map(CustomerMapper::toDomain)
                .toList();
    }

    @Override
    public Page<Customer> findAll(Pageable pageable) {
        return jpaRepository.findAll(pageable)
                .map(CustomerMapper::toDomain);
    }

    @Override
    public Customer save(Customer customer) {
        return CustomerMapper.toDomain(jpaRepository.save(CustomerMapper.toJpa(customer)));
    }

    @Override
    public boolean existsByEmail(String email) {
        return jpaRepository.existsByEmail(email);
    }

    @Override
    public boolean existsByEmailAndIdNot(String email, Long id) {
        return jpaRepository.existsByEmailAndIdNot(email, id);
    }
}
