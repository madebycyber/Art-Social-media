package com.artsocial.backend.repository;

import com.artsocial.backend.entity.CollectionItem;
import com.artsocial.backend.entity.CollectionItemId;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

// Lưu ý: JpaRepository nhận vào <Entity, ID Class>
public interface CollectionItemRepository extends JpaRepository<CollectionItem, CollectionItemId> {
    // Tìm tất cả item thuộc về 1 collection
    List<CollectionItem> findByCollectionId(Long collectionId);
    
    // Check tồn tại
    boolean existsByCollectionIdAndArtworkId(Long collectionId, Long artworkId);
}