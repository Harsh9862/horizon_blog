package com.horizon.blog.dto.response;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class DashboardResponse {
    long totalViews;
    long totalLikes;
    long totalFollowers;
    double avgReadTime;
}
