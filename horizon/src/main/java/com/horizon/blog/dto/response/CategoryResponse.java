package com.horizon.blog.dto.response;

import lombok.Builder;
import lombok.Value;

import java.util.UUID;

@Value
@Builder
public class CategoryResponse {
    UUID id;
    String name;
    String slug;
    String icon;
    long storyCount;
}
