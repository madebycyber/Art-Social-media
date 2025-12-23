package com.artsocial.backend.controller;

import com.artsocial.backend.dto.ChatRoomDTO;
import com.artsocial.backend.dto.CollectionDTO; // Import DTO mới
import com.artsocial.backend.entity.*;
import com.artsocial.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired private ArtworkRepository artworkRepository;
    @Autowired private CollectionRepository collectionRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private CollectionItemRepository collectionItemRepository;
    @Autowired private FollowRepository followRepository;
    @Autowired private ChatRoomRepository chatRoomRepository;

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // --- 1. LẤY DANH SÁCH TRANH ĐÃ LIKE ---
    @GetMapping("/me/likes")
    public List<Artwork> getMyLikedArtworks() {
        return artworkRepository.findLikedArtworksByUserId(getCurrentUser().getId());
    }

    @GetMapping("/me/liked-ids")
    public List<Long> getMyLikedArtworkIds() {
        return artworkRepository.findLikedArtworkIdsByUserId(getCurrentUser().getId());
    }

    // --- 2. LẤY DANH SÁCH BỘ SƯU TẬP (QUAN TRỌNG: Dùng CollectionDTO) ---
    // Đã sửa logic để trả về DTO chứa thông tin Artwork thay vì Entity rỗng
    @GetMapping("/me/collections")
    public ResponseEntity<List<CollectionDTO>> getMyCollections() {
        User user = getCurrentUser();
        
        // A. Lấy list Collection từ DB
        // (Đảm bảo CollectionRepository có hàm findByUserIdOrderByCreatedAtDesc hoặc findByUserId)
        List<Collection> collections = collectionRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        
        // B. Map sang DTO
        List<CollectionDTO> result = new ArrayList<>();
        
        for (Collection col : collections) {
            CollectionDTO dto = new CollectionDTO();
            dto.setId(col.getId());
            dto.setName(col.getName());
            dto.setCreatedAt(col.getCreatedAt());

            // Lấy items của collection này từ bảng collection_items
            List<CollectionItem> items = collectionItemRepository.findByCollectionId(col.getId());
            List<CollectionDTO.CollectionItemDTO> itemDTOs = new ArrayList<>();

            for (CollectionItem item : items) {
                // Tìm thông tin Artwork từ artworkId
                Artwork art = artworkRepository.findById(item.getArtworkId()).orElse(null);
                
                if (art != null) {
                    CollectionDTO.CollectionItemDTO itemDto = new CollectionDTO.CollectionItemDTO();
                    itemDto.setCollectionId(item.getCollectionId());
                    itemDto.setArtworkId(item.getArtworkId());
                    itemDto.setAddedAt(item.getAddedAt());
                    itemDto.setArtwork(art); // QUAN TRỌNG: Gán Artwork vào để Frontend hiển thị ảnh
                    itemDTOs.add(itemDto);
                }
            }
            
            dto.setCollectionItems(itemDTOs);
            result.add(dto);
        }

        return ResponseEntity.ok(result);
    }

    // --- 3. TẠO BỘ SƯU TẬP MỚI ---
    @PostMapping("/me/collections")
    public ResponseEntity<?> createCollection(@RequestParam String name) {
        Collection col = new Collection();
        col.setName(name);
        col.setUser(getCurrentUser());
        // createdAt được DB tự động sinh hoặc set tại đây nếu cần
        return ResponseEntity.ok(collectionRepository.save(col));
    }

    // --- 4. THÊM TRANH VÀO BỘ SƯU TẬP ---
    @PostMapping("/me/collections/{collectionId}/add/{artworkId}")
    public ResponseEntity<?> addArtworkToCollection(@PathVariable Long collectionId, @PathVariable Long artworkId) {
        User currentUser = getCurrentUser();
        Collection collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new RuntimeException("Collection not found"));
        
        // Check quyền sở hữu
        if (!collection.getUser().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).body("Không phải bộ sưu tập của bạn");
        }

        // Check tranh tồn tại
        if (!artworkRepository.existsById(artworkId)) {
            return ResponseEntity.badRequest().body("Tranh không tồn tại");
        }

        // Check đã có trong collection chưa (Tránh lỗi trùng lặp)
        if (collectionItemRepository.existsByCollectionIdAndArtworkId(collectionId, artworkId)) {
            return ResponseEntity.badRequest().body("Tranh này đã có trong bộ sưu tập");
        }

        // Lưu
        CollectionItem item = new CollectionItem();
        item.setCollectionId(collectionId);
        item.setArtworkId(artworkId);
        // addedAt được DB tự sinh hoặc set tại đây
        
        collectionItemRepository.save(item);
        return ResponseEntity.ok("Đã thêm vào bộ sưu tập");
    }

    // --- CÁC API FOLLOW GIỮ NGUYÊN ---
    @PostMapping("/{targetId}/follow")
    public ResponseEntity<?> followUser(@PathVariable Long targetId) {
        Long myId = getCurrentUser().getId();
        if (myId.equals(targetId)) return ResponseEntity.badRequest().body("Không thể tự follow");
        followRepository.save(new Follow(myId, targetId));
        return ResponseEntity.ok("Followed");
    }

    @DeleteMapping("/{targetId}/follow")
    public ResponseEntity<?> unfollowUser(@PathVariable Long targetId) {
        Long myId = getCurrentUser().getId();
        followRepository.deleteById(new FollowId(myId, targetId));
        return ResponseEntity.ok("Unfollowed");
    }

    @GetMapping("/me/following-ids")
    public List<Long> getMyFollowingIds() {
        return followRepository.findFollowingIdsByUserId(getCurrentUser().getId());
    }

    @GetMapping("/me/following")
    public List<User> getMyFollowing() {
        return followRepository.findFollowingByUserId(getCurrentUser().getId());
    }

    @GetMapping("/me/followers")
    public List<User> getMyFollowers() {
        return followRepository.findFollowersByUserId(getCurrentUser().getId());
    }

    // --- API CHAT ROOMS ---
    @GetMapping("/me/chat-rooms")
    public List<ChatRoomDTO> getMyChatRooms() {
        Long myId = getCurrentUser().getId();
        List<ChatRoom> rooms = chatRoomRepository.findBySenderIdOrderByLastMessageAtDesc(myId);
        List<ChatRoomDTO> result = new ArrayList<>();

        for (ChatRoom room : rooms) {
            userRepository.findById(room.getRecipientId()).ifPresent(recipient -> {
                ChatRoomDTO dto = new ChatRoomDTO();
                dto.setRoomId(room.getId());
                dto.setRecipientId(recipient.getId());
                dto.setRecipientName(recipient.getUsername());
                // dto.setRecipientAvatar(...) 
                dto.setLastMessage(room.getLastMessage());
                dto.setLastMessageAt(room.getLastMessageAt());
                dto.setUnreadCount(room.getUnreadCount());
                result.add(dto);
            });
        }
        return result;
    }
}