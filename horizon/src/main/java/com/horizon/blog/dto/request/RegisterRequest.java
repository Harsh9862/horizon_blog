package com.horizon.blog.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    @Size(min = 3, max = 50)
    private String username;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 8, max = 120)
    private String password;

    @NotBlank
    @Size(max = 100)
    private String displayName;

    @Size(max = 1000)
    private String bio;

    @Size(max = 500)
    private String avatarUrl;
}
