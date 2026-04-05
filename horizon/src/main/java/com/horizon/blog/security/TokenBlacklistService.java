package com.horizon.blog.security;

import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TokenBlacklistService {

    private final Set<String> invalidatedTokens = ConcurrentHashMap.newKeySet();

    public void invalidate(String token) {
        if (token != null && !token.isBlank()) {
            invalidatedTokens.add(token);
        }
    }

    public boolean isInvalidated(String token) {
        return token != null && invalidatedTokens.contains(token);
    }
}
