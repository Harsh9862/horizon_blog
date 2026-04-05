package com.horizon.blog.dto.response;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ToggleStateResponse {
    boolean active;
    long count;
    String message;
}
