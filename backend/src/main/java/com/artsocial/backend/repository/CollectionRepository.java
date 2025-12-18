package com.artsocial.backend.repository;

import com.artsocial.backend.entity.Collection;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CollectionRepository extends JpaRepository<Collection, Long> {
    List<Collection> findByUserId(Long userId);
}