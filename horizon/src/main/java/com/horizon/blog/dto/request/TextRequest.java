package com.horizon.blog.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TextRequest {
    @NotBlank
    private String text;
}
