package com.artsocial.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RestController
@RequestMapping("/api/redis/search-history")
public class SearchHistoryController {

    @Autowired
    private StringRedisTemplate redisTemplate;

    // Lấy ID/Username của người dùng hiện tại để làm Key cho Redis
    private String getUserKey() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return "search_history:" + username;
    }

    // 1. NHẬP (Insert) - Lưu từ khóa tìm kiếm mới
    @PostMapping
    public ResponseEntity<?> addSearchKeyword(@RequestParam String keyword) {
        String key = getUserKey();
        // Dùng ZSET (Sorted Set) để lưu từ khóa kèm điểm số (thời gian hiện tại)
        // Giúp sắp xếp từ khóa mới nhất lên đầu
        long timestamp = System.currentTimeMillis();
        redisTemplate.opsForZSet().add(key, keyword, timestamp);
        return ResponseEntity.ok("Đã lưu từ khóa: " + keyword);
    }

    // 2. SỬA (Update) - Cập nhật lại thời gian tìm kiếm nếu từ khóa đã tồn tại
    @PutMapping
    public ResponseEntity<?> updateSearchKeyword(@RequestParam String keyword) {
        String key = getUserKey();
        // Cập nhật lại điểm số (thời gian) thành mới nhất
        long newTimestamp = System.currentTimeMillis();
        redisTemplate.opsForZSet().add(key, keyword, newTimestamp); // Trùng value thì ZSET sẽ update Score
        return ResponseEntity.ok("Đã cập nhật thời gian cho từ khóa: " + keyword);
    }

    // 3. XÓA (Delete) - Xóa một từ khóa khỏi lịch sử
    @DeleteMapping
    public ResponseEntity<?> deleteSearchKeyword(@RequestParam String keyword) {
        String key = getUserKey();
        redisTemplate.opsForZSet().remove(key, keyword);
        return ResponseEntity.ok("Đã xóa từ khóa: " + keyword);
    }

    // 4. LỌC / TÌM KIẾM (Filter/Search) - Lấy danh sách lịch sử theo thứ tự mới nhất
    @GetMapping
    public ResponseEntity<?> getSearchHistory() {
        String key = getUserKey();
        // Truy vấn danh sách từ khóa, sắp xếp theo thời gian giảm dần (từ mới nhất đến cũ nhất)
        Set<String> history = redisTemplate.opsForZSet().reverseRange(key, 0, -1);
        return ResponseEntity.ok(history);
    }

    // 4.1 LỌC NÂNG CAO - Xóa toàn bộ key của User này (Xóa toàn bộ lịch sử)
    @DeleteMapping("/clear-all")
    public ResponseEntity<?> clearAllHistory() {
        String key = getUserKey();
        redisTemplate.delete(key);
        return ResponseEntity.ok("Đã xóa sạch lịch sử tìm kiếm");
    }
}