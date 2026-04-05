package com.horizon.blog.controller;

import com.horizon.blog.dto.request.UpdateProfileRequest;
import com.horizon.blog.dto.response.PaginationResponse;
import com.horizon.blog.dto.response.PostResponse;
import com.horizon.blog.dto.response.ToggleStateResponse;
import com.horizon.blog.dto.response.UserProfileResponse;
import com.horizon.blog.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{username}")
    public ResponseEntity<UserProfileResponse> getProfile(@PathVariable String username) {
        return ResponseEntity.ok(userService.getPublicProfile(username));
    }

    @GetMapping("/{username}/posts")
    public ResponseEntity<PaginationResponse<PostResponse>> getUserPosts(
            @PathVariable String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(userService.getPublishedPosts(username, page, size));
    }

    @PostMapping("/{username}/follow")
    public ResponseEntity<ToggleStateResponse> toggleFollow(@PathVariable String username) {
        return ResponseEntity.ok(userService.toggleFollow(username));
    }

    @GetMapping("/{username}/follow")
    public ResponseEntity<ToggleStateResponse> getFollowState(@PathVariable String username) {
        return ResponseEntity.ok(userService.getFollowState(username));
    }

    @PutMapping("/me")
    public ResponseEntity<UserProfileResponse> updateCurrentUser(@Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateCurrentUser(request));
    }
}
