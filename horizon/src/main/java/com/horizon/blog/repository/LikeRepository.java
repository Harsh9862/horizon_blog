package com.horizon.blog.repository;

import com.horizon.blog.model.entity.Like;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface LikeRepository extends JpaRepository<Like, UUID> {
    Optional<Like> findByUserIdAndPostId(UUID userId, UUID postId);
    boolean existsByUserIdAndPostId(UUID userId, UUID postId);
    long countByPostId(UUID postId);
    long countByPostAuthorId(UUID authorId);
}
