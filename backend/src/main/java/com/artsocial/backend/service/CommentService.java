package com.artsocial.backend.service;

import com.artsocial.backend.entity.*;
import com.artsocial.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CommentService {
    @Autowired private CommentRepository commentRepository;
    @Autowired private CommentVoteRepository commentVoteRepository;
    @Autowired private ArtworkRepository artworkRepository;
    @Autowired private UserRepository userRepository;

    // Lấy comment và map trạng thái vote của user hiện tại vào
    public List<Comment> getCommentsByArtwork(Long artworkId, String username) {
        List<Comment> comments = commentRepository.findByArtworkId(artworkId);
        
        if (username != null) {
            User user = userRepository.findByUsername(username).orElse(null);
            if (user != null) {
                // Lấy tất cả ID comment
                List<Long> commentIds = comments.stream().map(Comment::getId).collect(Collectors.toList());
                // Lấy các vote của user cho đống comment này
                List<CommentVote> votes = commentVoteRepository.findByUserIdAndCommentIdIn(user.getId(), commentIds);
                // Map vào object Comment để frontend biết
                Map<Long, Integer> voteMap = votes.stream().collect(Collectors.toMap(CommentVote::getCommentId, CommentVote::getVoteType));
                
                comments.forEach(c -> c.setUserVoteType(voteMap.getOrDefault(c.getId(), 0)));
            }
        }
        return comments;
    }

    public Comment addComment(Long artworkId, String username, String content, Long parentId) {
        User user = userRepository.findByUsername(username).orElseThrow();
        Artwork artwork = artworkRepository.findById(artworkId).orElseThrow();
        
        Comment comment = new Comment();
        comment.setContent(content);
        comment.setUser(user);
        comment.setArtwork(artwork);
        
        if (parentId != null) {
            Comment parent = commentRepository.findById(parentId).orElse(null);
            comment.setParent(parent);
        }
        
        return commentRepository.save(comment);
    }

    @Transactional
    public void voteComment(Long commentId, String username, int voteType) {
        // voteType: 1 (Up), -1 (Down), 0 (Unvote)
        User user = userRepository.findByUsername(username).orElseThrow();
        CommentVoteId id = new CommentVoteId(user.getId(), commentId);
        
        if (voteType == 0) {
            commentVoteRepository.deleteById(id); // Xóa vote (Trigger tự giảm count)
        } else {
            CommentVote vote = new CommentVote(user.getId(), commentId, voteType);
            commentVoteRepository.save(vote); // Save đè lên (Trigger tự update count)
        }
    }
}