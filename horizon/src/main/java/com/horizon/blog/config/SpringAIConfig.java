package com.horizon.blog.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SpringAIConfig {

    @Bean
    @ConditionalOnProperty(name = "spring.ai.model.chat", havingValue = "google-genai")
    public ChatClient chatClient(ChatClient.Builder builder) {
        return builder.build();
    }
}
