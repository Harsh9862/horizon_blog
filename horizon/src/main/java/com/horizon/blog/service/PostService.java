package com.horizon.blog.service;

import com.horizon.blog.dto.request.CreatePostRequest;
import com.horizon.blog.dto.request.UpdatePostRequest;
import com.horizon.blog.dto.response.PaginationResponse;
import com.horizon.blog.dto.response.PostResponse;
import com.horizon.blog.dto.response.ToggleStateResponse;
import com.horizon.blog.exception.ResourceNotFoundException;
import com.horizon.blog.exception.UnauthorizedException;
import com.horizon.blog.model.entity.Bookmark;
import com.horizon.blog.model.entity.Category;
import com.horizon.blog.model.entity.Like;
import com.horizon.blog.model.entity.Post;
import com.horizon.blog.model.entity.Tag;
import com.horizon.blog.model.entity.User;
import com.horizon.blog.model.enums.PostStatus;
import com.horizon.blog.model.enums.PostVisibility;
import com.horizon.blog.repository.BookmarkRepository;
import com.horizon.blog.repository.LikeRepository;
import com.horizon.blog.repository.PostRepository;
import com.horizon.blog.repository.TagRepository;
import com.horizon.blog.util.ResponseMapper;
import com.horizon.blog.util.SlugUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final TagRepository tagRepository;
    private final LikeRepository likeRepository;
    private final BookmarkRepository bookmarkRepository;
    private final UserService userService;
    private final CategoryService categoryService;
    private final ResponseMapper responseMapper;

    public PaginationResponse<PostResponse> getPosts(int page, int size, String sort, String category, String tag, String search) {
        Pageable pageable = PageRequest.of(page, size, resolveSort(sort));
        return PaginationResponse.from(
                postRepository.searchPosts(category, tag, normalize(search), true, pageable).map(this::toPostResponse)
        );
    }

    @Transactional
    public PostResponse getPostBySlug(String slug) {
        Post post = postRepository.findDetailedBySlug(slug)
                .filter(existing -> existing.getStatus() == PostStatus.PUBLISHED && existing.getVisibility() == PostVisibility.PUBLIC)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found."));

        post.setViewCount(post.getViewCount() + 1);
        postRepository.save(post);
        return toPostResponse(post);
    }

    public PostResponse getOwnedPostById(UUID postId) {
        return toPostResponse(getOwnedPost(postId));
    }

    @Transactional
    public PostResponse createPost(CreatePostRequest request) {
        User author = userService.getCurrentUser();
        Category category = categoryService.getCategoryEntity(request.getCategorySlug());

        Post post = Post.builder()
                .title(request.getTitle().trim())
                .subtitle(request.getSubtitle())
                .slug(generateUniqueSlug(request.getTitle()))
                .body(request.getBody().trim())
                .coverImageUrl(request.getCoverImageUrl())
                .status(request.getStatus())
                .visibility(request.getVisibility())
                .readTimeMinutes(calculateReadTime(request.getBody()))
                .viewCount(0L)
                .author(author)
                .category(category)
                .tags(resolveTags(request.getTags()))
                .publishedAt(request.getStatus() == PostStatus.PUBLISHED ? LocalDateTime.now() : null)
                .build();

        Post savedPost = postRepository.save(post);
        categoryService.refreshStoryCount(category);
        return toPostResponse(savedPost);
    }

    @Transactional
    public PostResponse updatePost(UUID postId, UpdatePostRequest request) {
        Post post = getOwnedPost(postId);
        Category previousCategory = post.getCategory();
        Category nextCategory = categoryService.getCategoryEntity(request.getCategorySlug());
        String desiredTitle = request.getTitle().trim();
        String baseCurrent = post.getSlug().replaceFirst("-\\d+$", "");
        String baseIncoming = SlugUtils.toSlug(desiredTitle);
        boolean wasPublished = post.getStatus() == PostStatus.PUBLISHED;
        PostStatus nextStatus = request.getStatus() != null ? request.getStatus() : post.getStatus();

        post.setTitle(desiredTitle);
        post.setSubtitle(request.getSubtitle());
        post.setBody(request.getBody().trim());
        post.setCoverImageUrl(request.getCoverImageUrl());
        post.setCategory(nextCategory);
        post.setTags(resolveTags(request.getTags()));
        post.setReadTimeMinutes(calculateReadTime(request.getBody()));
        post.setVisibility(request.getVisibility() != null ? request.getVisibility() : post.getVisibility());
        post.setStatus(nextStatus);

        if (!baseCurrent.equals(baseIncoming)) {
            post.setSlug(generateUniqueSlug(desiredTitle));
        }

        if (!wasPublished && nextStatus == PostStatus.PUBLISHED) {
            post.setPublishedAt(LocalDateTime.now());
        }
        if (wasPublished && nextStatus == PostStatus.DRAFT) {
            post.setPublishedAt(null);
        }

        Post saved = postRepository.save(post);
        categoryService.refreshStoryCount(previousCategory);
        if (!previousCategory.getId().equals(nextCategory.getId())) {
            categoryService.refreshStoryCount(nextCategory);
        }
        return toPostResponse(saved);
    }

    @Transactional
    public void deletePost(UUID postId) {
        Post post = getOwnedPost(postId);
        Category category = post.getCategory();
        postRepository.delete(post);
        categoryService.refreshStoryCount(category);
    }

    @Transactional
    public PostResponse publishPost(UUID postId) {
        Post post = getOwnedPost(postId);
        post.setStatus(PostStatus.PUBLISHED);
        if (post.getPublishedAt() == null) {
            post.setPublishedAt(LocalDateTime.now());
        }
        Post saved = postRepository.save(post);
        categoryService.refreshStoryCount(saved.getCategory());
        return toPostResponse(saved);
    }

    @Transactional
    public PostResponse draftPost(UUID postId) {
        Post post = getOwnedPost(postId);
        post.setStatus(PostStatus.DRAFT);
        post.setPublishedAt(null);
        Post saved = postRepository.save(post);
        categoryService.refreshStoryCount(saved.getCategory());
        return toPostResponse(saved);
    }

    public PostResponse getFeaturedPost() {
        return postRepository.findFeaturedPost(PageRequest.of(0, 1)).stream()
                .findFirst()
                .map(this::toPostResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Featured post not found."));
    }

    public List<PostResponse> getTrendingPosts() {
        LocalDateTime startOfWeek = LocalDateTime.now().with(DayOfWeek.MONDAY).toLocalDate().atStartOfDay();
        return postRepository.findTrendingPosts(startOfWeek, PageRequest.of(0, 4)).stream()
                .map(this::toPostResponse)
                .toList();
    }

    @Transactional
    public ToggleStateResponse toggleLike(UUID postId) {
        User currentUser = userService.getCurrentUser();
        Post post = getPostEntity(postId);

        boolean active;
        var existing = likeRepository.findByUserIdAndPostId(currentUser.getId(), postId);
        if (existing.isPresent()) {
            likeRepository.delete(existing.get());
            active = false;
        } else {
            likeRepository.save(Like.builder().user(currentUser).post(post).build());
            active = true;
        }

        return ToggleStateResponse.builder()
                .active(active)
                .count(likeRepository.countByPostId(postId))
                .message(active ? "Post liked." : "Like removed.")
                .build();
    }

    public ToggleStateResponse getLikeState(UUID postId) {
        User currentUser = userService.getCurrentUser();
        return ToggleStateResponse.builder()
                .active(likeRepository.existsByUserIdAndPostId(currentUser.getId(), postId))
                .count(likeRepository.countByPostId(postId))
                .message("Like state fetched.")
                .build();
    }

    @Transactional
    public ToggleStateResponse toggleBookmark(UUID postId) {
        User currentUser = userService.getCurrentUser();
        Post post = getPostEntity(postId);

        boolean active;
        var existing = bookmarkRepository.findByUserIdAndPostId(currentUser.getId(), postId);
        if (existing.isPresent()) {
            bookmarkRepository.delete(existing.get());
            active = false;
        } else {
            bookmarkRepository.save(Bookmark.builder().user(currentUser).post(post).build());
            active = true;
        }

        return ToggleStateResponse.builder()
                .active(active)
                .count(bookmarkRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId()).size())
                .message(active ? "Post bookmarked." : "Bookmark removed.")
                .build();
    }

    public List<PostResponse> getBookmarks() {
        User currentUser = userService.getCurrentUser();
        return bookmarkRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId()).stream()
                .map(Bookmark::getPost)
                .map(this::toPostResponse)
                .toList();
    }

    public PaginationResponse<PostResponse> getCurrentUserPosts(String status, int page, int size) {
        User user = userService.getCurrentUser();
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        if (status == null || status.isBlank() || "all".equalsIgnoreCase(status)) {
            return PaginationResponse.from(postRepository.findByAuthorIdOrderByUpdatedAtDesc(user.getId(), pageable)
                    .map(this::toPostResponse));
        }

        PostStatus postStatus = PostStatus.valueOf(status.toUpperCase());
        return PaginationResponse.from(postRepository.findByAuthorIdAndStatusOrderByUpdatedAtDesc(user.getId(), postStatus, pageable)
                .map(this::toPostResponse));
    }

    public List<PostResponse> getCurrentUserDrafts() {
        User user = userService.getCurrentUser();
        return postRepository.findByAuthorIdAndStatusOrderByUpdatedAtDesc(user.getId(), PostStatus.DRAFT, PageRequest.of(0, 50)).stream()
                .map(this::toPostResponse)
                .toList();
    }

    public PostResponse toPostResponse(Post post) {
        return responseMapper.toPostResponse(post);
    }

    public Post getPostEntity(UUID postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found."));
    }

    private Post getOwnedPost(UUID postId) {
        User currentUser = userService.getCurrentUser();
        Post post = getPostEntity(postId);
        if (!post.getAuthor().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You can only modify your own posts.");
        }
        return post;
    }

    private Set<Tag> resolveTags(List<String> tags) {
        Set<Tag> resolvedTags = new HashSet<>();
        if (tags == null) {
            return resolvedTags;
        }

        for (String tagName : tags) {
            if (tagName == null || tagName.isBlank()) {
                continue;
            }
            Tag tag = tagRepository.findByNameIgnoreCase(tagName.trim())
                    .orElseGet(() -> tagRepository.save(Tag.builder().name(tagName.trim()).build()));
            resolvedTags.add(tag);
        }
        return resolvedTags;
    }

    private String generateUniqueSlug(String title) {
        String baseSlug = SlugUtils.toSlug(title);
        String candidate = baseSlug;
        int counter = 1;
        while (postRepository.existsBySlug(candidate)) {
            candidate = baseSlug + "-" + counter++;
        }
        return candidate;
    }

    private int calculateReadTime(String body) {
        int words = body == null || body.isBlank() ? 0 : body.trim().split("\\s+").length;
        return Math.max(1, (int) Math.ceil(words / 200.0));
    }

    private Sort resolveSort(String sort) {
        if (sort == null || sort.isBlank() || "latest".equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Direction.DESC, "publishedAt");
        }
        if ("mostread".equalsIgnoreCase(sort) || "most_read".equalsIgnoreCase(sort) || "viewCount".equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Direction.DESC, "viewCount");
        }
        String[] parts = sort.split(",");
        if (parts.length == 2) {
            return Sort.by(Sort.Direction.fromString(parts[1]), parts[0]);
        }
        return Sort.by(Sort.Direction.DESC, sort);
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
