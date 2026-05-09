package com.oms.infrastructure.persistence.mapper;

import com.oms.domain.model.User;
import com.oms.infrastructure.persistence.entity.UserJpaEntity;

public final class UserMapper {

    private UserMapper() {
        // utility class — no instantiation
    }

    public static User toDomain(UserJpaEntity entity) {
        if (entity == null) return null;
        return User.rehydrate(
                entity.getId(),
                entity.getUsername(),
                entity.getPassword(),
                entity.getRole(),
                entity.getCreatedAt()
        );
    }

    public static UserJpaEntity toJpa(User user) {
        if (user == null) return null;
        return new UserJpaEntity(
                user.getId(),
                user.getUsername(),
                user.getPassword(),
                user.getRole()
        );
    }
}
