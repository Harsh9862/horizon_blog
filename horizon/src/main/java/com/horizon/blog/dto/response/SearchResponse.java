package com.horizon.blog.dto.response;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class SearchResponse {
    List<PostResponse> posts;
    List<UserProfileResponse> authors;
    List<String> tags;
}
