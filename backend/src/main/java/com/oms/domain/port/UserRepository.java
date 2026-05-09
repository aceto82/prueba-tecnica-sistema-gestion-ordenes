package com.oms.domain.port;

import com.oms.domain.model.User;

import java.util.Optional;

public interface UserRepository {

    Optional<User> findByUsername(String username);

    User save(User user);

    Optional<User> findById(Long id);
}
