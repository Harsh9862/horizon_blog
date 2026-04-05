package com.horizon.blog.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "jwt")
public class JwtConfig {

    @NotBlank
    private String secret;

    @NotNull
    private Long expiration;

    @NotNull
    private Long refreshExpiration;
}
