package com.horizon.blog.controller;

import com.horizon.blog.dto.response.DashboardAnalyticsResponse;
import com.horizon.blog.dto.response.DashboardResponse;
import com.horizon.blog.dto.response.PaginationResponse;
import com.horizon.blog.dto.response.PostResponse;
import com.horizon.blog.service.DashboardService;
import com.horizon.blog.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final PostService postService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardResponse> stats() {
        return ResponseEntity.ok(dashboardService.getStats());
    }

    @GetMapping("/posts")
    public ResponseEntity<PaginationResponse<PostResponse>> posts(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(postService.getCurrentUserPosts(status, page, size));
    }

    @GetMapping("/analytics")
    public ResponseEntity<DashboardAnalyticsResponse> analytics() {
        return ResponseEntity.ok(dashboardService.getAnalytics());
    }

    @GetMapping("/drafts")
    public ResponseEntity<List<PostResponse>> drafts() {
        return ResponseEntity.ok(postService.getCurrentUserDrafts());
    }
}
