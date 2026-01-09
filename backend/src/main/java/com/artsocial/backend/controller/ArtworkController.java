package com.artsocial.backend.controller;

import com.artsocial.backend.entity.Artwork;
import com.artsocial.backend.repository.ArtworkRepository;
import com.artsocial.backend.service.ArtworkService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/artworks")
public class ArtworkController {

    @Autowired
    private ArtworkService artworkService;
    @Autowired
    private ArtworkRepository artworkRepository;
    
    private final String UPLOAD_DIR = System.getProperty("user.dir") + "/uploads/";

    // 1. Upload thêm param "privacy"
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> upload(@RequestParam("title") String title,
                                    @RequestParam("caption") String caption,
                                    @RequestParam(value = "privacy", defaultValue = "PUBLIC") String privacy, // Thêm
                                    @RequestParam("file") MultipartFile file) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            return ResponseEntity.ok(artworkService.uploadArtwork(username, title, caption, privacy, file));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Lỗi upload: " + e.getMessage());
        }
    }

    // 2. Get All (Chỉ trả về Public)
    @GetMapping
    public List<Artwork> getAll() {
        return artworkService.getAllPublicArtworks();
    }

    // 3. API Like
    @PostMapping("/{id}/like")
    public ResponseEntity<?> likeArtwork(@PathVariable Long id) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        artworkService.likeArtwork(id, username);
        return ResponseEntity.ok("Liked");
    }

    // 4. API Unlike
    @DeleteMapping("/{id}/like")
    public ResponseEntity<?> unlikeArtwork(@PathVariable Long id) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        artworkService.unlikeArtwork(id, username);
        return ResponseEntity.ok("Unliked");
    }

    // 5. API Get Image (Giữ nguyên)
    @GetMapping("/images/{filename}")
    public ResponseEntity<Resource> getImage(@PathVariable String filename) {
        // ... (Code cũ giữ nguyên) ...
        try {
            Path filePath = Paths.get(UPLOAD_DIR).resolve(filename);
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() || resource.isReadable()) {
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) contentType = "application/octet-stream";
                return ResponseEntity.ok().contentType(MediaType.parseMediaType(contentType)).body(resource);
            }
        } catch (Exception e) {}
        return ResponseEntity.notFound().build();
    }
    
// API lấy tranh của user (Code bạn vừa thêm bị lỗi)
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getArtworksByUser(@PathVariable Long userId) {
        // Bây giờ biến artworkRepository đã được khai báo, lỗi sẽ biến mất
        List<Artwork> artworks = artworkRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return ResponseEntity.ok(artworks);
    }

}