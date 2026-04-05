package com.horizon.blog.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GenerateSubtitleRequest {
    @NotBlank
    private String title;

    @NotBlank
    private String body;
}
