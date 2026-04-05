package com.horizon.blog.dto.response;

import com.horizon.blog.model.enums.Role;
import lombok.Builder;
import lombok.Value;

import java.util.UUID;

@Value
@Builder
public class AuthResponse {
    UUID userId;
    String username;
    String displayName;
    String email;
    Role role;
    String token;
    String refreshToken;
    String tokenType;
    long expiresIn;
}
