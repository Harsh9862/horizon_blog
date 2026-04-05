package com.horizon.blog.util;

import com.horizon.blog.dto.response.CategoryResponse;
import com.horizon.blog.dto.response.PostResponse;
import com.horizon.blog.model.entity.Category;
import com.horizon.blog.model.entity.Post;
import com.horizon.blog.model.entity.Tag;
import com.horizon.blog.repository.BookmarkRepository;
import com.horizon.blog.repository.LikeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ResponseMapper {

    private final LikeRepository likeRepository;
    private final BookmarkRepository bookmarkRepository;

    public PostResponse toPostResponse(Post post) {
        return PostResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .subtitle(post.getSubtitle())
                .slug(post.getSlug())
                .body(post.getBody())
                .coverImageUrl(post.getCoverImageUrl())
                .status(post.getStatus())
                .visibility(post.getVisibility())
                .readTimeMinutes(post.getReadTimeMinutes())
                .viewCount(post.getViewCount())
                .likeCount(likeRepository.countByPostId(post.getId()))
                .bookmarkCount(bookmarkRepository.countByPostId(post.getId()))
                .author(PostResponse.AuthorSummary.builder()
                        .id(post.getAuthor().getId())
                        .username(post.getAuthor().getUsername())
                        .displayName(post.getAuthor().getDisplayName())
                        .avatarUrl(post.getAuthor().getAvatarUrl())
                        .build())
                .category(post.getCategory() == null ? null : PostResponse.CategorySummary.builder()
                        .id(post.getCategory().getId())
                        .name(post.getCategory().getName())
                        .slug(post.getCategory().getSlug())
                        .icon(post.getCategory().getIcon())
                        .build())
                .tags(post.getTags().stream().map(Tag::getName).sorted().toList())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .publishedAt(post.getPublishedAt())
                .build();
    }

    public CategoryResponse toCategoryResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .icon(category.getIcon())
                .storyCount(category.getStoryCount())
                .build();
    }
}
