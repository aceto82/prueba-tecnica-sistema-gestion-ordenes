package com.oms.application.service;

import com.oms.domain.exception.DuplicateUsernameException;
import com.oms.domain.model.Role;
import com.oms.domain.model.User;
import com.oms.domain.port.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    @Test
    void create_withNewUsername_savesAndReturns() {
        when(userRepository.existsByUsername("alice")).thenReturn(false);
        when(passwordEncoder.encode("Pass123")).thenReturn("hashed-pass");
        User saved = User.rehydrate(1L, "alice", "hashed-pass", Role.USER);
        when(userRepository.save(any())).thenReturn(saved);

        User result = userService.create("alice", "Pass123", Role.USER);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getUsername()).isEqualTo("alice");
        assertThat(result.getRole()).isEqualTo(Role.USER);
        verify(userRepository).save(any());
    }

    @Test
    void create_withDuplicateUsername_throwsDuplicateUsernameException() {
        when(userRepository.existsByUsername("alice")).thenReturn(true);

        assertThatThrownBy(() -> userService.create("alice", "Pass123", Role.USER))
                .isInstanceOf(DuplicateUsernameException.class)
                .hasMessageContaining("alice");

        verify(userRepository, never()).save(any());
    }

    @Test
    void update_withNewUsername_updatesAndReturns() {
        User existing = User.rehydrate(1L, "alice", "hashed", Role.USER);
        when(userRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(userRepository.existsByUsernameAndIdNot("alice2", 1L)).thenReturn(false);
        User updated = User.rehydrate(1L, "alice2", "hashed", Role.ADMIN);
        when(userRepository.save(any())).thenReturn(updated);

        User result = userService.update(1L, "alice2", Role.ADMIN);

        assertThat(result.getUsername()).isEqualTo("alice2");
        assertThat(result.getRole()).isEqualTo(Role.ADMIN);
        verify(userRepository).save(any());
    }

    @Test
    void update_withUsernameTakenByOther_throwsDuplicateUsernameException() {
        User existing = User.rehydrate(1L, "alice", "hashed", Role.USER);
        when(userRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(userRepository.existsByUsernameAndIdNot("bob", 1L)).thenReturn(true);

        assertThatThrownBy(() -> userService.update(1L, "bob", Role.USER))
                .isInstanceOf(DuplicateUsernameException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    void getById_notFound_throwsEntityNotFoundException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getById(99L))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void delete_existingUser_removesUser() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(User.rehydrate(1L, "alice", "pass", Role.USER)));

        userService.delete(1L);

        verify(userRepository).deleteById(1L);
    }

    @Test
    void delete_nonExistentUser_throwsEntityNotFoundException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.delete(99L))
                .isInstanceOf(EntityNotFoundException.class);

        verify(userRepository, never()).deleteById(any());
    }
}
