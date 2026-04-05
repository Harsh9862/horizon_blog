package com.horizon.blog.security;

import com.horizon.blog.config.JwtConfig;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.DecodingException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtTokenProvider {

    private final JwtConfig jwtConfig;
    private SecretKey key;

    public JwtTokenProvider(JwtConfig jwtConfig) {
        this.jwtConfig = jwtConfig;
    }

    @PostConstruct
    public void init() {
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(jwtConfig.getSecret());
        } catch (IllegalArgumentException | DecodingException ex) {
            keyBytes = jwtConfig.getSecret().getBytes(StandardCharsets.UTF_8);
        }
        this.key = Keys.hmacShaKeyFor(keyBytes.length >= 32 ? keyBytes : padKey(keyBytes));
    }

    public String generateAccessToken(UserDetails userDetails) {
        return generateToken(userDetails.getUsername(), jwtConfig.getExpiration(), "access");
    }

    public String generateRefreshToken(UserDetails userDetails) {
        return generateToken(userDetails.getUsername(), jwtConfig.getRefreshExpiration(), "refresh");
    }

    public String getUsername(String token) {
        return getClaims(token).getSubject();
    }

    public boolean isValidToken(String token, UserDetails userDetails) {
        return getUsername(token).equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    public boolean isAccessToken(String token) {
        return "access".equals(getTokenType(token));
    }

    public boolean isRefreshToken(String token) {
        return "refresh".equals(getTokenType(token));
    }

    public long getExpirationMs() {
        return jwtConfig.getExpiration();
    }

    private String generateToken(String username, long expirationMs, String type) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", type);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(username)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    private boolean isTokenExpired(String token) {
        return getClaims(token).getExpiration().before(new Date());
    }

    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private String getTokenType(String token) {
        Object type = getClaims(token).get("type");
        return type == null ? null : type.toString();
    }

    private byte[] padKey(byte[] keyBytes) {
        byte[] padded = new byte[32];
        for (int i = 0; i < padded.length; i++) {
            padded[i] = keyBytes[i % keyBytes.length];
        }
        return padded;
    }
}
