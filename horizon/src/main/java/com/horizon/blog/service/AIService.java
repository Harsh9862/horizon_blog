package com.horizon.blog.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.horizon.blog.exception.ResourceNotFoundException;
import com.horizon.blog.model.entity.Post;
import com.horizon.blog.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AIService {

    private final ObjectProvider<ChatClient> chatClientProvider;
    private final PostRepository postRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${spring.ai.google.genai.api-key:}")
    private String apiKey;

    public String improveWriting(String text) {
        if (apiKey == null || apiKey.isBlank()) {
            return text.trim();
        }
        return prompt("""
                You are an editorial assistant for Horizon Blog.
                Improve the text for clarity, rhythm, and grammar while preserving the author's voice, meaning, and tone.
                Return only the improved text.
                """, text);
    }

    public String generateSubtitle(String title, String body) {
        if (apiKey == null || apiKey.isBlank()) {
            return title.trim() + " in a concise, compelling preview.";
        }
        return prompt("""
                You write sharp blog subtitles.
                Given a title and body, produce one subtitle under 160 characters.
                Return only the subtitle.
                """, "Title: " + title + "\nBody:\n" + body);
    }

    public String summarizePost(UUID postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found."));
        if (apiKey == null || apiKey.isBlank()) {
            String text = post.getBody().replaceAll("\\s+", " ").trim();
            return text.substring(0, Math.min(text.length(), 220));
        }
        return prompt("""
                Summarize the blog post in 2 to 3 clean sentences suitable for a preview card.
                Return only the summary.
                """, post.getTitle() + "\n\n" + post.getBody());
    }

    public List<String> suggestTags(String title, String body) {
        if (apiKey == null || apiKey.isBlank()) {
            return List.of("Writing", "Ideas", "Culture");
        }
        String response = prompt("""
                Suggest 3 to 5 concise blog tags for the given post.
                Return only a JSON array of strings.
                """, "Title: " + title + "\nBody:\n" + body);
        try {
            return objectMapper.readValue(response, new TypeReference<>() {});
        } catch (Exception ex) {
            return List.of("Writing", "Ideas", "Culture");
        }
    }

    public List<String> readingRecommendation(UUID postId) {
        Post target = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found."));
        List<Post> candidates = postRepository.findRecommendationCandidates(postId, PageRequest.of(0, 8));
        if (apiKey == null || apiKey.isBlank()) {
            return candidates.stream().limit(3).map(Post::getSlug).toList();
        }

        String candidateBlock = candidates.stream()
                .map(post -> "- title: " + post.getTitle() + ", slug: " + post.getSlug())
                .reduce("", (left, right) -> left + right + "\n");

        String response = prompt("""
                Select the best 3 related blog post slugs for the target post.
                Choose only from the candidate slugs provided.
                Return only a JSON array of slugs.
                """, "Target post:\n" + target.getTitle() + "\n" + target.getBody() + "\nCandidates:\n" + candidateBlock);
        try {
            return objectMapper.readValue(response, new TypeReference<>() {});
        } catch (Exception ex) {
            return candidates.stream().limit(3).map(Post::getSlug).toList();
        }
    }

    private String prompt(String system, String user) {
        ChatClient chatClient = chatClientProvider.getIfAvailable();
        if (chatClient == null) {
            throw new IllegalStateException("AI model is not configured.");
        }
        return chatClient.prompt()
                .system(system)
                .user(user)
                .call()
                .content();
    }
}
