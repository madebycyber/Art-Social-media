package com.artsocial.backend.controller;

import com.artsocial.backend.dto.CommentRequest;
import com.artsocial.backend.entity.Comment;
import com.artsocial.backend.service.CommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    @Autowired private CommentService commentService;

    // Lấy comment của 1 tranh
    @GetMapping("/artwork/{artworkId}")
    public List<Comment> getComments(@PathVariable Long artworkId) {
        String username = "Anonymous";
        try {
            username = SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {} // Cho phép khách xem comment
        
        return commentService.getCommentsByArtwork(artworkId, username.equals("anonymousUser") ? null : username);
    }

    // Đăng comment (SỬA ĐỂ NHẬN JSON)
    @PostMapping
    public ResponseEntity<?> addComment(@RequestBody CommentRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        
        // Gọi service với dữ liệu từ request body
        return ResponseEntity.ok(commentService.addComment(
            request.getArtworkId(), 
            username, 
            request.getContent(), 
            request.getParentId()
        ));
    }

    // Vote comment
    @PostMapping("/{id}/vote")
    public ResponseEntity<?> voteComment(@PathVariable Long id, @RequestParam int type) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        commentService.voteComment(id, username, type);
        return ResponseEntity.ok("Voted");
    }
}