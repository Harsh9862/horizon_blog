package com.horizon.blog.repository;

import com.horizon.blog.model.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    @EntityGraph(attributePaths = {"followers", "following"})
    @Query("select u from User u where u.username = :username")
    Optional<User> findProfileByUsername(@Param("username") String username);

    @Query("""
            select distinct u from User u
            where lower(u.username) like lower(concat('%', :query, '%'))
               or lower(u.displayName) like lower(concat('%', :query, '%'))
               or lower(coalesce(u.bio, '')) like lower(concat('%', :query, '%'))
            """)
    List<User> searchUsers(@Param("query") String query);
}
