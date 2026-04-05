package com.horizon.blog.controller;

import com.horizon.blog.dto.response.PostResponse;
import com.horizon.blog.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/bookmarks")
@RequiredArgsConstructor
public class BookmarkController {

    private final PostService postService;

    @GetMapping
    public ResponseEntity<List<PostResponse>> getBookmarks() {
        return ResponseEntity.ok(postService.getBookmarks());
    }
}
