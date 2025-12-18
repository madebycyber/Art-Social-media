package com.artsocial.backend.controller;

import com.artsocial.backend.entity.Artwork;
import com.artsocial.backend.entity.Collection;
import com.artsocial.backend.entity.User;
import com.artsocial.backend.repository.ArtworkRepository;
import com.artsocial.backend.repository.CollectionRepository;
import com.artsocial.backend.repository.UserRepository;
import com.artsocial.backend.repository.CollectionItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.artsocial.backend.entity.CollectionItem;
import com.artsocial.backend.entity.Follow;
import com.artsocial.backend.entity.FollowId;
import com.artsocial.backend.repository.FollowRepository;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private ArtworkRepository artworkRepository;
    @Autowired
    private CollectionRepository collectionRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private CollectionItemRepository collectionItemRepository;
    @Autowired
    private FollowRepository followRepository; // Inject Repository


    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username).orElseThrow();
    }

    // Lấy danh sách tranh đã Like
    @GetMapping("/me/likes")
    public List<Artwork> getMyLikedArtworks() {
        return artworkRepository.findLikedArtworksByUserId(getCurrentUser().getId());
    }

    // Lấy danh sách ID tranh đã Like (để check ở Home)
    @GetMapping("/me/liked-ids")
    public List<Long> getMyLikedArtworkIds() {
        return artworkRepository.findLikedArtworkIdsByUserId(getCurrentUser().getId());
    }

    // Lấy danh sách Collection
    @GetMapping("/me/collections")
    public List<Collection> getMyCollections() {
        return collectionRepository.findByUserId(getCurrentUser().getId());
    }

    // Tạo Collection mới
    @PostMapping("/me/collections")
    public ResponseEntity<?> createCollection(@RequestParam String name) {
        Collection col = new Collection();
        col.setName(name);
        col.setUser(getCurrentUser());
        return ResponseEntity.ok(collectionRepository.save(col));
    }

    @PostMapping("/me/collections/{collectionId}/add/{artworkId}")
    public ResponseEntity<?> addArtworkToCollection(@PathVariable Long collectionId, @PathVariable Long artworkId) {
        // Kiểm tra xem collection có phải của user này không (để bảo mật)
        User currentUser = getCurrentUser();
        Collection collection = collectionRepository.findById(collectionId).orElseThrow();
        
        if (!collection.getUser().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).body("Không phải bộ sưu tập của bạn");
        }

        CollectionItem item = new CollectionItem(collectionId, artworkId, null);
        collectionItemRepository.save(item);
        return ResponseEntity.ok("Đã thêm vào bộ sưu tập");
    }

    // 1. Follow một người
    @PostMapping("/{targetId}/follow")
    public ResponseEntity<?> followUser(@PathVariable Long targetId) {
        Long myId = getCurrentUser().getId();
        if (myId.equals(targetId)) return ResponseEntity.badRequest().body("Không thể tự follow");
        
        followRepository.save(new Follow(myId, targetId));
        return ResponseEntity.ok("Followed");
    }

    // 2. Unfollow
    @DeleteMapping("/{targetId}/follow")
    public ResponseEntity<?> unfollowUser(@PathVariable Long targetId) {
        Long myId = getCurrentUser().getId();
        followRepository.deleteById(new FollowId(myId, targetId));
        return ResponseEntity.ok("Unfollowed");
    }

    // 3. Lấy danh sách ID người mình đang follow (để tô màu nút Follow)
    @GetMapping("/me/following-ids")
    public List<Long> getMyFollowingIds() {
        return followRepository.findFollowingIdsByUserId(getCurrentUser().getId());
    }

    // 4. Lấy danh sách User mình đang follow (Hiển thị Sidebar)
    @GetMapping("/me/following")
    public List<User> getMyFollowing() {
        return followRepository.findFollowingByUserId(getCurrentUser().getId());
    }

    // 5. Lấy danh sách User đang follow mình (Hiển thị Sidebar)
    @GetMapping("/me/followers")
    public List<User> getMyFollowers() {
        return followRepository.findFollowersByUserId(getCurrentUser().getId());
    }
}