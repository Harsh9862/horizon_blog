package com.horizon.blog.repository;

import com.horizon.blog.model.entity.Bookmark;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BookmarkRepository extends JpaRepository<Bookmark, UUID> {
    Optional<Bookmark> findByUserIdAndPostId(UUID userId, UUID postId);
    boolean existsByUserIdAndPostId(UUID userId, UUID postId);
    long countByPostId(UUID postId);

    @EntityGraph(attributePaths = {"post", "post.author", "post.category", "post.tags"})
    List<Bookmark> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
