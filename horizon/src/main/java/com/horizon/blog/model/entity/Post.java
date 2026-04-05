package com.horizon.blog.model.entity;

import com.horizon.blog.model.enums.PostStatus;
import com.horizon.blog.model.enums.PostVisibility;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class Post {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 300)
    private String subtitle;

    @Column(nullable = false, unique = true, length = 220)
    private String slug;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String body;

    @Column(name = "cover_image_url", length = 500)
    private String coverImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PostStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PostVisibility visibility;

    @Column(name = "read_time_minutes", nullable = false)
    private Integer readTimeMinutes;

    @Column(name = "view_count", nullable = false)
    private Long viewCount;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "post_tags",
            joinColumns = @JoinColumn(name = "post_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    @Builder.Default
    private Set<Tag> tags = new HashSet<>();

    @OneToMany(mappedBy = "post", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<Like> likes = new HashSet<>();

    @OneToMany(mappedBy = "post", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<Bookmark> bookmarks = new HashSet<>();

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (status == null) {
            status = PostStatus.DRAFT;
        }
        if (visibility == null) {
            visibility = PostVisibility.PUBLIC;
        }
        if (viewCount == null) {
            viewCount = 0L;
        }
        if (readTimeMinutes == null) {
            readTimeMinutes = 1;
        }
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
