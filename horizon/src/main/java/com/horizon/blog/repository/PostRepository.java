package com.horizon.blog.repository;

import com.horizon.blog.model.entity.Post;
import com.horizon.blog.model.enums.PostStatus;
import com.horizon.blog.model.enums.PostVisibility;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PostRepository extends JpaRepository<Post, UUID> {

    boolean existsBySlug(String slug);

    Optional<Post> findBySlug(String slug);

    @EntityGraph(attributePaths = {"author", "category", "tags"})
    @Query("select p from Post p where p.slug = :slug")
    Optional<Post> findDetailedBySlug(String slug);

    @EntityGraph(attributePaths = {"author", "category", "tags"})
    @Query("""
            select distinct p from Post p
            left join p.tags t
            where (:publishedOnly = false or (p.status = com.horizon.blog.model.enums.PostStatus.PUBLISHED and p.visibility = com.horizon.blog.model.enums.PostVisibility.PUBLIC))
              and (:categorySlug is null or p.category.slug = :categorySlug)
              and (:tagName is null or lower(t.name) = lower(:tagName))
              and (:search is null or lower(p.title) like lower(concat('%', :search, '%'))
                   or lower(coalesce(p.subtitle, '')) like lower(concat('%', :search, '%'))
                   or lower(p.body) like lower(concat('%', :search, '%')))
            """)
    Page<Post> searchPosts(String categorySlug, String tagName, String search, boolean publishedOnly, Pageable pageable);

    @EntityGraph(attributePaths = {"author", "category", "tags"})
    Page<Post> findByAuthorUsernameAndStatusOrderByPublishedAtDesc(String username, PostStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"author", "category", "tags"})
    Page<Post> findByAuthorIdAndStatusOrderByUpdatedAtDesc(UUID authorId, PostStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"author", "category", "tags"})
    Page<Post> findByAuthorIdOrderByUpdatedAtDesc(UUID authorId, Pageable pageable);

    @EntityGraph(attributePaths = {"author", "category", "tags"})
    Page<Post> findByCategorySlugAndStatusOrderByPublishedAtDesc(String slug, PostStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"author", "category", "tags"})
    @Query("""
            select p from Post p
            where p.status = com.horizon.blog.model.enums.PostStatus.PUBLISHED
              and p.visibility = com.horizon.blog.model.enums.PostVisibility.PUBLIC
            order by p.viewCount desc, p.publishedAt desc
            """)
    List<Post> findFeaturedPost(Pageable pageable);

    @EntityGraph(attributePaths = {"author", "category", "tags"})
    @Query("""
            select p from Post p
            where p.status = com.horizon.blog.model.enums.PostStatus.PUBLISHED
              and p.visibility = com.horizon.blog.model.enums.PostVisibility.PUBLIC
              and p.publishedAt >= :startOfWeek
            order by p.viewCount desc, p.publishedAt desc
            """)
    List<Post> findTrendingPosts(LocalDateTime startOfWeek, Pageable pageable);

    long countByAuthorIdAndStatus(UUID authorId, PostStatus status);

    @Query("select coalesce(sum(p.viewCount), 0) from Post p where p.author.id = :authorId and p.status = :status")
    long sumViewsByAuthorAndStatus(UUID authorId, PostStatus status);

    @Query("""
            select distinct p from Post p
            left join fetch p.tags
            where p.id in :ids
            """)
    List<Post> findAllDetailedByIdIn(List<UUID> ids);

    @Query("""
            select p from Post p
            where p.status = com.horizon.blog.model.enums.PostStatus.PUBLISHED
              and p.visibility = com.horizon.blog.model.enums.PostVisibility.PUBLIC
              and p.id <> :postId
            order by p.viewCount desc, p.publishedAt desc
            """)
    List<Post> findRecommendationCandidates(UUID postId, Pageable pageable);
}
