package com.artsocial.backend.repository;

import com.artsocial.backend.entity.CollectionItem;
import com.artsocial.backend.entity.CollectionItemId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CollectionItemRepository extends JpaRepository<CollectionItem, CollectionItemId> {
}