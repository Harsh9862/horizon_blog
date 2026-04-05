package com.horizon.blog.controller;

import com.horizon.blog.dto.request.CreatePostRequest;
import com.horizon.blog.dto.request.UpdatePostRequest;
import com.horizon.blog.dto.response.PaginationResponse;
import com.horizon.blog.dto.response.PostResponse;
import com.horizon.blog.dto.response.ToggleStateResponse;
import com.horizon.blog.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @GetMapping
    public ResponseEntity<PaginationResponse<PostResponse>> getPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "latest") String sort,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) String search
    ) {
        return ResponseEntity.ok(postService.getPosts(page, size, sort, category, tag, search));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<PostResponse> getPost(@PathVariable String slug) {
        return ResponseEntity.ok(postService.getPostBySlug(slug));
    }

    @GetMapping("/id/{id}")
    public ResponseEntity<PostResponse> getOwnedPostById(@PathVariable UUID id) {
        return ResponseEntity.ok(postService.getOwnedPostById(id));
    }

    @PostMapping
    public ResponseEntity<PostResponse> createPost(@Valid @RequestBody CreatePostRequest request) {
        return ResponseEntity.ok(postService.createPost(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PostResponse> updatePost(@PathVariable UUID id, @Valid @RequestBody UpdatePostRequest request) {
        return ResponseEntity.ok(postService.updatePost(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable UUID id) {
        postService.deletePost(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/publish")
    public ResponseEntity<PostResponse> publishPost(@PathVariable UUID id) {
        return ResponseEntity.ok(postService.publishPost(id));
    }

    @PatchMapping("/{id}/draft")
    public ResponseEntity<PostResponse> draftPost(@PathVariable UUID id) {
        return ResponseEntity.ok(postService.draftPost(id));
    }

    @GetMapping("/featured")
    public ResponseEntity<PostResponse> featuredPost() {
        return ResponseEntity.ok(postService.getFeaturedPost());
    }

    @GetMapping("/trending")
    public ResponseEntity<List<PostResponse>> trendingPosts() {
        return ResponseEntity.ok(postService.getTrendingPosts());
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<ToggleStateResponse> toggleLike(@PathVariable UUID id) {
        return ResponseEntity.ok(postService.toggleLike(id));
    }

    @GetMapping("/{id}/like")
    public ResponseEntity<ToggleStateResponse> likeState(@PathVariable UUID id) {
        return ResponseEntity.ok(postService.getLikeState(id));
    }

    @PostMapping("/{id}/bookmark")
    public ResponseEntity<ToggleStateResponse> toggleBookmark(@PathVariable UUID id) {
        return ResponseEntity.ok(postService.toggleBookmark(id));
    }
}
