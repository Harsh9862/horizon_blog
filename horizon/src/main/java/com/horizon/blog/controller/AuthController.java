package com.horizon.blog.controller;

import com.horizon.blog.dto.request.LoginRequest;
import com.horizon.blog.dto.request.RefreshTokenRequest;
import com.horizon.blog.dto.request.RegisterRequest;
import com.horizon.blog.dto.response.AuthResponse;
import com.horizon.blog.dto.response.UserProfileResponse;
import com.horizon.blog.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refresh(request.getRefreshToken()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(@RequestHeader(name = "Authorization", required = false) String authorization) {
        String token = authorization != null && authorization.startsWith("Bearer ") ? authorization.substring(7) : authorization;
        authService.logout(token);
        return ResponseEntity.ok(Map.of("message", "Logged out successfully."));
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> me() {
        return ResponseEntity.ok(authService.me());
    }
}
