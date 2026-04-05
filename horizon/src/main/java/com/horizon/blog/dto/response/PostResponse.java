package com.horizon.blog.dto.response;

import com.horizon.blog.model.enums.PostStatus;
import com.horizon.blog.model.enums.PostVisibility;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Value
@Builder
public class PostResponse {
    UUID id;
    String title;
    String subtitle;
    String slug;
    String body;
    String coverImageUrl;
    PostStatus status;
    PostVisibility visibility;
    Integer readTimeMinutes;
    Long viewCount;
    Long likeCount;
    Long bookmarkCount;
    AuthorSummary author;
    CategorySummary category;
    List<String> tags;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
    LocalDateTime publishedAt;

    @Value
    @Builder
    public static class AuthorSummary {
        UUID id;
        String username;
        String displayName;
        String avatarUrl;
    }

    @Value
    @Builder
    public static class CategorySummary {
        UUID id;
        String name;
        String slug;
        String icon;
    }
}
