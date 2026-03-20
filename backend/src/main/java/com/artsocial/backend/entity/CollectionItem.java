package com.artsocial.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.io.Serializable; // NHỚ IMPORT DÒNG NÀY


@Entity
@Table(name = "collection_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@IdClass(CollectionItemId.class) // Composite Key
public class CollectionItem {

    private static final long serialVersionUID = 1L;

    @Id
    @Column(name = "collection_id")
    private Long collectionId;

    @Id
    @Column(name = "artwork_id")
    private Long artworkId;

    @Column(name = "added_at", insertable = false, updatable = false)
    private LocalDateTime addedAt;
}