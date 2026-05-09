package com.oms.infrastructure.persistence;

import com.oms.domain.model.User;
import com.oms.domain.port.UserRepository;
import com.oms.infrastructure.persistence.mapper.UserMapper;
import com.oms.infrastructure.persistence.repository.UserJpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class UserRepositoryAdapter implements UserRepository {

    private final UserJpaRepository jpaRepository;

    public UserRepositoryAdapter(UserJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Optional<User> findByUsername(String username) {
        return jpaRepository.findByUsername(username)
                .map(UserMapper::toDomain);
    }

    @Override
    public User save(User user) {
        return UserMapper.toDomain(jpaRepository.save(UserMapper.toJpa(user)));
    }

    @Override
    public Optional<User> findById(Long id) {
        return jpaRepository.findById(id)
                .map(UserMapper::toDomain);
    }
}
