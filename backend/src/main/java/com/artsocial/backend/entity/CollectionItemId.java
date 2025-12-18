package com.artsocial.backend.entity;
import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CollectionItemId implements Serializable {
    private Long collectionId;
    private Long artworkId;
}