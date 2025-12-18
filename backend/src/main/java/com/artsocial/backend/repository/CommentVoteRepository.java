package com.artsocial.backend.repository;

import com.artsocial.backend.entity.CommentVote;
import com.artsocial.backend.entity.CommentVoteId;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommentVoteRepository extends JpaRepository<CommentVote, CommentVoteId> {
    // Lấy list vote của user cho 1 danh sách comment (để tô màu nút vote ở Frontend)
    List<CommentVote> findByUserIdAndCommentIdIn(Long userId, List<Long> commentIds);
}