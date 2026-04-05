package com.horizon.blog.dto.response;

import com.horizon.blog.model.enums.Role;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.UUID;

@Value
@Builder
public class UserProfileResponse {
    UUID id;
    String username;
    String email;
    String displayName;
    String bio;
    String avatarUrl;
    Role role;
    long followers;
    long following;
    long publishedPosts;
    long totalViews;
    LocalDateTime createdAt;
}
