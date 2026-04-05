package com.horizon.blog.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class PostIdRequest {
    @NotNull
    private UUID postId;
}
