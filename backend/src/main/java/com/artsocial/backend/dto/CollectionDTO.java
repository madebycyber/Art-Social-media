package com.artsocial.backend.dto;

import com.artsocial.backend.entity.Artwork;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class CollectionDTO {
    private Long id;
    private String name;
    private LocalDateTime createdAt;
    
    // List này để Frontend map: item.artwork.filePath
    private List<CollectionItemDTO> collectionItems; 

    @Data
    public static class CollectionItemDTO {
        private Long collectionId;
        private Long artworkId;
        private Artwork artwork; // Chứa full thông tin tranh
        private LocalDateTime addedAt;
    }
}