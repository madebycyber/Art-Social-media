package com.artsocial.backend.service;

import com.artsocial.backend.audit.LogAudit;
import com.artsocial.backend.entity.Artwork;
import com.artsocial.backend.entity.ArtworkLike;
import com.artsocial.backend.entity.User;
import com.artsocial.backend.enums.PrivacyStatus;
import com.artsocial.backend.repository.ArtworkLikeRepository;
import com.artsocial.backend.repository.ArtworkRepository;
import com.artsocial.backend.repository.UserRepository;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.util.UUID;

@Service
public class ArtworkService {

    @Autowired
    private ArtworkRepository artworkRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ArtworkLikeRepository artworkLikeRepository;

    private final String UPLOAD_DIR = System.getProperty("user.dir") + "/uploads/";

    @LogAudit(action = "UPLOAD_ARTWORK")
    public Artwork uploadArtwork(String username, String title, String caption, String privacyStr, MultipartFile file) throws IOException {

        // 1. Tạo folder 
        File dir = new File(UPLOAD_DIR);
        if (!dir.exists()) dir.mkdirs();

        // 2. Đọc và Resize ảnh 
        BufferedImage originalImage = ImageIO.read(file.getInputStream());
        int width = originalImage.getWidth();
        int height = originalImage.getHeight();
        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        File destinationFile = new File(UPLOAD_DIR + fileName);
        
        if (width > 10000 || height > 10000) {
            Thumbnails.of(originalImage).size(10000, 10000).outputQuality(0.9).toFile(destinationFile);
            BufferedImage resized = ImageIO.read(destinationFile);
            width = resized.getWidth();
            height = resized.getHeight();
        } else {
            file.transferTo(destinationFile);
        }

        // 3. Lưu DB với Privacy
        User user = userRepository.findByUsername(username).orElseThrow();
        Artwork artwork = new Artwork();
        artwork.setTitle(title);
        artwork.setCaption(caption);
        artwork.setFilePath(fileName);
        artwork.setWidth(width);
        artwork.setHeight(height);
        artwork.setUser(user);
        
        // Convert String sang Enum
        try {
            artwork.setPrivacy(PrivacyStatus.valueOf(privacyStr.toUpperCase()));
        } catch (Exception e) {
            artwork.setPrivacy(PrivacyStatus.PUBLIC); // Mặc định là Public nếu gửi sai
        }

        return artworkRepository.save(artwork);
    }

    // Lấy danh sách tranh (Chỉ lấy Public)
    public java.util.List<Artwork> getAllPublicArtworks() {
        return artworkRepository.findAllPublicArtworks();
    }

    // Chức năng LIKE tranh
    @Transactional
    public void likeArtwork(Long artworkId, String username) {
        User user = userRepository.findByUsername(username).orElseThrow();
        if (!artworkLikeRepository.existsByUserIdAndArtworkId(user.getId(), artworkId)) {
            artworkLikeRepository.save(new ArtworkLike(user.getId(), artworkId));
            // Trigger trong SQL sẽ tự tăng count, không cần code Java tăng tay
        }
    }

    // Chức năng UNLIKE tranh
    @Transactional
    public void unlikeArtwork(Long artworkId, String username) {
        User user = userRepository.findByUsername(username).orElseThrow();
        ArtworkLike like = new ArtworkLike(user.getId(), artworkId);
        artworkLikeRepository.delete(like); 
        // Trigger SQL tự giảm count
    }
}