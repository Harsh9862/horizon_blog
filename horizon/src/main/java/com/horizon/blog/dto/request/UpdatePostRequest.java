package com.horizon.blog.dto.request;

import com.horizon.blog.model.enums.PostStatus;
import com.horizon.blog.model.enums.PostVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class UpdatePostRequest {
    @NotBlank
    @Size(max = 200)
    private String title;

    @Size(max = 300)
    private String subtitle;

    @NotBlank
    private String body;

    @Size(max = 500)
    private String coverImageUrl;

    @NotBlank
    private String categorySlug;

    private List<String> tags;

    private PostStatus status;

    private PostVisibility visibility;
}
