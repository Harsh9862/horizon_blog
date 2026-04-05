package com.horizon.blog.controller;

import com.horizon.blog.dto.request.GenerateSubtitleRequest;
import com.horizon.blog.dto.request.PostIdRequest;
import com.horizon.blog.dto.request.TextRequest;
import com.horizon.blog.service.AIService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIController {

    private final AIService aiService;

    @PostMapping("/improve-writing")
    public ResponseEntity<Map<String, String>> improveWriting(@Valid @RequestBody TextRequest request) {
        return ResponseEntity.ok(Map.of("text", aiService.improveWriting(request.getText())));
    }

    @PostMapping("/generate-subtitle")
    public ResponseEntity<Map<String, String>> generateSubtitle(@Valid @RequestBody GenerateSubtitleRequest request) {
        return ResponseEntity.ok(Map.of("subtitle", aiService.generateSubtitle(request.getTitle(), request.getBody())));
    }

    @PostMapping("/summarize")
    public ResponseEntity<Map<String, String>> summarize(@Valid @RequestBody PostIdRequest request) {
        return ResponseEntity.ok(Map.of("summary", aiService.summarizePost(request.getPostId())));
    }

    @PostMapping("/suggest-tags")
    public ResponseEntity<Map<String, Object>> suggestTags(@Valid @RequestBody GenerateSubtitleRequest request) {
        return ResponseEntity.ok(Map.of("tags", aiService.suggestTags(request.getTitle(), request.getBody())));
    }

    @PostMapping("/reading-recommendation")
    public ResponseEntity<Map<String, Object>> readingRecommendation(@Valid @RequestBody PostIdRequest request) {
        return ResponseEntity.ok(Map.of("slugs", aiService.readingRecommendation(request.getPostId())));
    }
}
