package com.artsocial.backend.entity;

import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable; // NHỚ IMPORT DÒNG NÀY


@Data
@NoArgsConstructor
@AllArgsConstructor
public class ArtworkLikeId implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long userId;
    private Long artworkId;
}