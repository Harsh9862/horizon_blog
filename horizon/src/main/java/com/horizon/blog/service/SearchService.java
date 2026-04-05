package com.horizon.blog.service;

import com.horizon.blog.dto.response.PostResponse;
import com.horizon.blog.dto.response.SearchResponse;
import com.horizon.blog.dto.response.UserProfileResponse;
import com.horizon.blog.model.entity.Tag;
import com.horizon.blog.repository.TagRepository;
import com.horizon.blog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final PostService postService;
    private final UserRepository userRepository;
    private final TagRepository tagRepository;
    private final UserService userService;

    public SearchResponse search(String query, String type, int page, int size) {
        String normalizedType = type == null ? "all" : type.toLowerCase();
        boolean includePosts = normalizedType.equals("all") || normalizedType.equals("story");
        boolean includeAuthors = normalizedType.equals("all") || normalizedType.equals("author");
        boolean includeTags = normalizedType.equals("all") || normalizedType.equals("tag");

        List<PostResponse> posts = includePosts
                ? postService.getPosts(page, size, "latest", null, null, query).getContent()
                : Collections.emptyList();
        List<UserProfileResponse> authors = includeAuthors
                ? userRepository.searchUsers(query).stream()
                .limit(size)
                .map(user -> userService.toProfileResponse(user, false))
                .toList()
                : Collections.emptyList();
        List<String> tags = includeTags
                ? tagRepository.findByNameContainingIgnoreCase(query).stream()
                .map(Tag::getName)
                .limit(size)
                .toList()
                : Collections.emptyList();

        return SearchResponse.builder()
                .posts(posts)
                .authors(authors)
                .tags(tags)
                .build();
    }
}
