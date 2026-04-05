package com.horizon.blog.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @NotBlank
    @Size(max = 100)
    private String displayName;

    @Size(max = 1000)
    private String bio;

    @Size(max = 500)
    private String avatarUrl;
}
