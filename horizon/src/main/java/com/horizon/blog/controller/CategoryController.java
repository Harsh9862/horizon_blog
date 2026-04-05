package com.horizon.blog.controller;

import com.horizon.blog.dto.response.CategoryResponse;
import com.horizon.blog.dto.response.PaginationResponse;
import com.horizon.blog.dto.response.PostResponse;
import com.horizon.blog.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @GetMapping("/{slug}")
    public ResponseEntity<CategoryResponse> getCategory(@PathVariable String slug) {
        return ResponseEntity.ok(categoryService.getCategory(slug));
    }

    @GetMapping("/{slug}/posts")
    public ResponseEntity<PaginationResponse<PostResponse>> getCategoryPosts(
            @PathVariable String slug,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(categoryService.getCategoryPosts(slug, page, size));
    }
}
