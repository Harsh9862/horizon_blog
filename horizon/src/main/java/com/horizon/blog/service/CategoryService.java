package com.horizon.blog.service;

import com.horizon.blog.dto.response.CategoryResponse;
import com.horizon.blog.dto.response.PaginationResponse;
import com.horizon.blog.dto.response.PostResponse;
import com.horizon.blog.exception.ResourceNotFoundException;
import com.horizon.blog.model.entity.Category;
import com.horizon.blog.model.enums.PostStatus;
import com.horizon.blog.repository.CategoryRepository;
import com.horizon.blog.repository.PostRepository;
import com.horizon.blog.util.ResponseMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final PostRepository postRepository;
    private final ResponseMapper responseMapper;

    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(responseMapper::toCategoryResponse)
                .toList();
    }

    public CategoryResponse getCategory(String slug) {
        return responseMapper.toCategoryResponse(getCategoryEntity(slug));
    }

    public PaginationResponse<PostResponse> getCategoryPosts(String slug, int page, int size) {
        return PaginationResponse.from(
                postRepository.findByCategorySlugAndStatusOrderByPublishedAtDesc(slug, PostStatus.PUBLISHED, PageRequest.of(page, size))
                        .map(responseMapper::toPostResponse)
        );
    }

    public Category getCategoryEntity(String slug) {
        return categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found."));
    }

    public void refreshStoryCount(Category category) {
        long publishedStories = postRepository.findByCategorySlugAndStatusOrderByPublishedAtDesc(
                category.getSlug(),
                PostStatus.PUBLISHED,
                PageRequest.of(0, 1)
        ).getTotalElements();
        category.setStoryCount(publishedStories);
        categoryRepository.save(category);
    }
}
