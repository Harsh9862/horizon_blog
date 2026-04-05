package com.horizon.blog.dto.response;

import lombok.Builder;
import lombok.Value;

import java.time.OffsetDateTime;

@Value
@Builder
public class ApiErrorResponse {
    int status;
    String error;
    String message;
    OffsetDateTime timestamp;
}
