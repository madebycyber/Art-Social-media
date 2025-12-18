package com.artsocial.backend.entity;

import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ArtworkLikeId implements Serializable {
    private Long userId;
    private Long artworkId;
}