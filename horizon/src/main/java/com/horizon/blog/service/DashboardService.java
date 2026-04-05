package com.horizon.blog.service;

import com.horizon.blog.dto.response.DashboardAnalyticsResponse;
import com.horizon.blog.dto.response.DashboardResponse;
import com.horizon.blog.model.entity.Post;
import com.horizon.blog.model.entity.User;
import com.horizon.blog.model.enums.PostStatus;
import com.horizon.blog.repository.LikeRepository;
import com.horizon.blog.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserService userService;
    private final PostRepository postRepository;
    private final LikeRepository likeRepository;

    public DashboardResponse getStats() {
        User user = userService.getCurrentUser();
        List<Post> publishedPosts = postRepository.findByAuthorIdAndStatusOrderByUpdatedAtDesc(user.getId(), PostStatus.PUBLISHED, PageRequest.of(0, 100)).getContent();

        double avgReadTime = publishedPosts.stream()
                .mapToInt(Post::getReadTimeMinutes)
                .average()
                .orElse(0.0);

        return DashboardResponse.builder()
                .totalViews(postRepository.sumViewsByAuthorAndStatus(user.getId(), PostStatus.PUBLISHED))
                .totalLikes(likeRepository.countByPostAuthorId(user.getId()))
                .totalFollowers(user.getFollowers().size())
                .avgReadTime(Math.round(avgReadTime * 10.0) / 10.0)
                .build();
    }

    public DashboardAnalyticsResponse getAnalytics() {
        User user = userService.getCurrentUser();
        List<Post> posts = postRepository.findByAuthorIdAndStatusOrderByUpdatedAtDesc(user.getId(), PostStatus.PUBLISHED, PageRequest.of(0, 50)).getContent();

        List<DashboardAnalyticsResponse.DailyMetric> viewsPerDay = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate day = LocalDate.now().minusDays(i);
            long views = posts.stream()
                    .filter(post -> post.getPublishedAt() != null && post.getPublishedAt().toLocalDate().equals(day))
                    .mapToLong(Post::getViewCount)
                    .sum();
            viewsPerDay.add(DashboardAnalyticsResponse.DailyMetric.builder()
                    .day(day.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH))
                    .views(views)
                    .build());
        }

        List<DashboardAnalyticsResponse.TopPostMetric> topPosts = posts.stream()
                .sorted((left, right) -> Long.compare(right.getViewCount(), left.getViewCount()))
                .limit(3)
                .map(post -> DashboardAnalyticsResponse.TopPostMetric.builder()
                        .title(post.getTitle())
                        .slug(post.getSlug())
                        .views(post.getViewCount())
                        .build())
                .toList();

        return DashboardAnalyticsResponse.builder()
                .viewsPerDay(viewsPerDay)
                .topPosts(topPosts)
                .build();
    }
}
