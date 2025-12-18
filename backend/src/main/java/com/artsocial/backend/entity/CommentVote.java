package com.artsocial.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "comment_votes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@IdClass(CommentVoteId.class) // Composite Key
public class CommentVote {
    @Id
    @Column(name = "user_id")
    private Long userId;

    @Id
    @Column(name = "comment_id")
    private Long commentId;

    @Column(name = "vote_type")
    private Integer voteType; // 1: Upvote, -1: Downvote
}