package com.oms.infrastructure.web.mapper;

import com.oms.domain.model.User;
import com.oms.infrastructure.web.dto.UserResponse;

public class UserDtoMapper {

    private UserDtoMapper() {}

    public static UserResponse toResponse(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getRole(), user.getCreatedAt());
    }
}
