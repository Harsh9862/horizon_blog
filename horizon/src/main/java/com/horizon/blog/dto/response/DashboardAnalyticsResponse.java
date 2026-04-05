package com.horizon.blog.dto.response;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class DashboardAnalyticsResponse {
    List<DailyMetric> viewsPerDay;
    List<TopPostMetric> topPosts;

    @Value
    @Builder
    public static class DailyMetric {
        String day;
        long views;
    }

    @Value
    @Builder
    public static class TopPostMetric {
        String title;
        String slug;
        long views;
    }
}
