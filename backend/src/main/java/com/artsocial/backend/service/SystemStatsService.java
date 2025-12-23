package com.artsocial.backend.service;

import com.artsocial.backend.entity.Artwork;
import com.artsocial.backend.entity.User;
import com.artsocial.backend.repository.ArtworkRepository;
import com.artsocial.backend.repository.ChatMessageRepository;
import com.artsocial.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SystemStatsService {

    @Autowired private UserRepository userRepository;
    @Autowired private ArtworkRepository artworkRepository;
    @Autowired private ChatMessageRepository chatMessageRepository;

    /**
     * Hàm này tạo ra một "Bản báo cáo thời gian thực" về toàn bộ hệ thống.
     * Chúng ta sẽ đưa bản báo cáo này cho AI để nó tự tra cứu khi cần.
     */
    public String getFullSystemReport(Long currentUserId) {
        StringBuilder report = new StringBuilder();

        report.append("=== BÁO CÁO DỮ LIỆU HỆ THỐNG THỜI GIAN THỰC ===\n");
        
        // 1. Số liệu tổng quan
        long totalUsers = userRepository.count();
        long totalArts = artworkRepository.count();
        long totalLikes = artworkRepository.sumTotalLikes();
        
        report.append("1. TỔNG QUAN:\n");
        report.append(String.format("- Tổng User: %d\n", totalUsers));
        report.append(String.format("- Tổng số tác phẩm: %d\n", totalArts));
        report.append(String.format("- Tổng lượt thích toàn sàn: %d\n", totalLikes));

        // 2. Top User (KOLs)
        List<User> topUsers = userRepository.findTop5MostFollowed();
        String userStats = topUsers.stream()
                .map(u -> u.getUsername() + " (ID: " + u.getId() + ")")
                .collect(Collectors.joining(", "));
        report.append("\n2. TOP USER (Nhiều follow nhất):\n- ").append(userStats).append("\n");

        // 3. User mới (Newbies)
        List<User> newUsers = userRepository.findTop3NewestUsers();
        String newUserStats = newUsers.stream().map(User::getUsername).collect(Collectors.joining(", "));
        report.append("- User mới tham gia: ").append(newUserStats).append("\n");

        // 4. Top Tranh (Hot)
        List<Artwork> topArts = artworkRepository.findTop5ByOrderByLikeCountDesc();
        report.append("\n3. TOP TRANH (Nhiều like nhất):\n");
        for (Artwork art : topArts) {
            report.append(String.format("- Tác phẩm: '%s' của họa sĩ %s (%d likes)\n", 
                    art.getTitle(), art.getUser().getUsername(), art.getLikeCount()));
        }

        // 5. Dữ liệu cá nhân (Personal Context)
        List<Object[]> topPartners = chatMessageRepository.findTopChatPartners(currentUserId);
        if (!topPartners.isEmpty()) {
            report.append("\n4. THÔNG TIN CÁ NHÂN NGƯỜI DÙNG ĐANG CHAT:\n");
            report.append("- Người hay nhắn tin cùng nhất: ");
            for (Object[] row : topPartners) {
                Long partnerId = ((Number) row[0]).longValue();
                Long count = ((Number) row[1]).longValue();
                String name = userRepository.findById(partnerId).map(User::getUsername).orElse("Unknown");
                report.append(name).append(" (").append(count).append(" tin), ");
            }
            report.append("\n");
        }
        
        report.append("=== KẾT THÚC BÁO CÁO ===\n");
        return report.toString();
    }
}