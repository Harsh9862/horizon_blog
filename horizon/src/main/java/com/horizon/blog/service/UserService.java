package com.horizon.blog.service;

import com.horizon.blog.dto.request.UpdateProfileRequest;
import com.horizon.blog.dto.response.PaginationResponse;
import com.horizon.blog.dto.response.PostResponse;
import com.horizon.blog.dto.response.ToggleStateResponse;
import com.horizon.blog.dto.response.UserProfileResponse;
import com.horizon.blog.exception.BadRequestException;
import com.horizon.blog.exception.ResourceNotFoundException;
import com.horizon.blog.model.entity.User;
import com.horizon.blog.model.enums.PostStatus;
import com.horizon.blog.repository.PostRepository;
import com.horizon.blog.repository.UserRepository;
import com.horizon.blog.util.ResponseMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final ResponseMapper responseMapper;

    public User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Current user was not found."));
    }

    public UserProfileResponse getPublicProfile(String username) {
        User user = userRepository.findProfileByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        return toProfileResponse(user, false);
    }

    public PaginationResponse<PostResponse> getPublishedPosts(String username, int page, int size) {
        return PaginationResponse.from(
                postRepository.findByAuthorUsernameAndStatusOrderByPublishedAtDesc(username, PostStatus.PUBLISHED, PageRequest.of(page, size))
                        .map(responseMapper::toPostResponse)
        );
    }

    public ToggleStateResponse toggleFollow(String username) {
        User currentUser = getCurrentUser();
        User targetUser = userRepository.findProfileByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        if (currentUser.getId().equals(targetUser.getId())) {
            throw new BadRequestException("You cannot follow yourself.");
        }

        boolean active;
        if (currentUser.getFollowing().contains(targetUser)) {
            currentUser.getFollowing().remove(targetUser);
            active = false;
        } else {
            currentUser.getFollowing().add(targetUser);
            active = true;
        }

        userRepository.save(currentUser);
        long followers = userRepository.findProfileByUsername(username)
                .map(user -> (long) user.getFollowers().size())
                .orElse(0L);

        return ToggleStateResponse.builder()
                .active(active)
                .count(followers)
                .message(active ? "User followed." : "User unfollowed.")
                .build();
    }

    public ToggleStateResponse getFollowState(String username) {
        User currentUser = getCurrentUser();
        User targetUser = userRepository.findProfileByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        return ToggleStateResponse.builder()
                .active(currentUser.getFollowing().contains(targetUser))
                .count(targetUser.getFollowers().size())
                .message("Follow state fetched.")
                .build();
    }

    @Transactional(readOnly = true)
    public UserProfileResponse toProfileResponse(User user, boolean includeEmail) {
        User profileUser = userRepository.findProfileByUsername(user.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        long publishedPosts = postRepository.countByAuthorIdAndStatus(profileUser.getId(), PostStatus.PUBLISHED);
        long totalViews = postRepository.sumViewsByAuthorAndStatus(profileUser.getId(), PostStatus.PUBLISHED);

        return UserProfileResponse.builder()
                .id(profileUser.getId())
                .username(profileUser.getUsername())
                .email(includeEmail ? profileUser.getEmail() : null)
                .displayName(profileUser.getDisplayName())
                .bio(profileUser.getBio())
                .avatarUrl(profileUser.getAvatarUrl())
                .role(profileUser.getRole())
                .followers(profileUser.getFollowers().size())
                .following(profileUser.getFollowing().size())
                .publishedPosts(publishedPosts)
                .totalViews(totalViews)
                .createdAt(profileUser.getCreatedAt())
                .build();
    }

    public UserProfileResponse updateCurrentUser(UpdateProfileRequest request) {
        User currentUser = getCurrentUser();
        currentUser.setDisplayName(request.getDisplayName().trim());
        currentUser.setBio(request.getBio());
        if (request.getAvatarUrl() != null) {
            currentUser.setAvatarUrl(request.getAvatarUrl().trim().isEmpty() ? null : request.getAvatarUrl().trim());
        }
        User saved = userRepository.save(currentUser);
        return toProfileResponse(saved, true);
    }
}
