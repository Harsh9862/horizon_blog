package com.horizon.blog.service;

import com.horizon.blog.dto.request.LoginRequest;
import com.horizon.blog.dto.request.RegisterRequest;
import com.horizon.blog.dto.response.AuthResponse;
import com.horizon.blog.dto.response.UserProfileResponse;
import com.horizon.blog.exception.BadRequestException;
import com.horizon.blog.exception.UnauthorizedException;
import com.horizon.blog.model.entity.User;
import com.horizon.blog.model.enums.Role;
import com.horizon.blog.repository.UserRepository;
import com.horizon.blog.security.JwtTokenProvider;
import com.horizon.blog.security.TokenBlacklistService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final TokenBlacklistService tokenBlacklistService;
    private final UserService userService;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered.");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username is already taken.");
        }

        User user = User.builder()
                .username(request.getUsername().trim().toLowerCase())
                .email(request.getEmail().trim().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getDisplayName().trim())
                .bio(request.getBio())
                .avatarUrl(request.getAvatarUrl())
                .role(Role.USER)
                .build();

        User savedUser = userRepository.save(user);
        UserDetails userDetails = buildUserDetails(savedUser);
        return buildAuthResponse(savedUser, userDetails);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password."));

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getUsername(), request.getPassword())
        );

        return buildAuthResponse(user, buildUserDetails(user));
    }

    public AuthResponse refresh(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new BadRequestException("Refresh token is required.");
        }
        if (tokenBlacklistService.isInvalidated(refreshToken) || !jwtTokenProvider.isRefreshToken(refreshToken)) {
            throw new UnauthorizedException("Invalid refresh token.");
        }

        String username;
        try {
            username = jwtTokenProvider.getUsername(refreshToken);
        } catch (RuntimeException ex) {
            throw new UnauthorizedException("Invalid refresh token.");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException("User not found for refresh token."));

        UserDetails userDetails = buildUserDetails(user);
        if (!jwtTokenProvider.isValidToken(refreshToken, userDetails)) {
            throw new UnauthorizedException("Refresh token has expired or is invalid.");
        }

        return buildAuthResponse(user, userDetails);
    }

    public void logout(String token) {
        if (token == null || token.isBlank()) {
            throw new BadRequestException("Authorization token is required.");
        }
        tokenBlacklistService.invalidate(token);
    }

    public UserProfileResponse me() {
        return userService.toProfileResponse(userService.getCurrentUser(), true);
    }

    private AuthResponse buildAuthResponse(User user, UserDetails userDetails) {
        return AuthResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .email(user.getEmail())
                .role(user.getRole())
                .token(jwtTokenProvider.generateAccessToken(userDetails))
                .refreshToken(jwtTokenProvider.generateRefreshToken(userDetails))
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getExpirationMs())
                .build();
    }

    private UserDetails buildUserDetails(User user) {
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername())
                .password(user.getPassword())
                .authorities("ROLE_" + user.getRole().name())
                .build();
    }
}
