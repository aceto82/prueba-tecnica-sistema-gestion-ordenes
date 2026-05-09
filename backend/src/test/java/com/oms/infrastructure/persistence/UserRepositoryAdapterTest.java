package com.oms.infrastructure.persistence;

import com.oms.domain.model.Role;
import com.oms.domain.model.User;
import com.oms.infrastructure.persistence.entity.UserJpaEntity;
import com.oms.infrastructure.persistence.repository.UserJpaRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@Import(UserRepositoryAdapter.class)
class UserRepositoryAdapterTest {

    @Autowired
    private UserRepositoryAdapter adapter;

    @Autowired
    private UserJpaRepository jpaRepository;

    @Test
    void findByUsername_existingUser_returnsDomainUser() {
        UserJpaEntity saved = jpaRepository.save(new UserJpaEntity(null, "john", "hashed", Role.USER));

        Optional<User> result = adapter.findByUsername("john");

        assertThat(result).isPresent();
        assertThat(result.get().getUsername()).isEqualTo("john");
        assertThat(result.get().getId()).isEqualTo(saved.getId());
    }

    @Test
    void findByUsername_nonExistingUser_returnsEmpty() {
        Optional<User> result = adapter.findByUsername("ghost");

        assertThat(result).isEmpty();
    }

    @Test
    void save_persistsAndReturnsDomainUser() {
        User user = User.create("alice", "secret", Role.ADMIN);

        User saved = adapter.save(user);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getUsername()).isEqualTo("alice");
        assertThat(saved.getRole()).isEqualTo(Role.ADMIN);
        assertThat(jpaRepository.findByUsername("alice")).isPresent();
    }
}
