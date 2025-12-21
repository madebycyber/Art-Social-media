package com.artsocial.backend.repository;

import com.artsocial.backend.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    Optional<ChatRoom> findBySenderIdAndRecipientId(Long senderId, Long recipientId);

    // Sửa hàm này: Sắp xếp theo thời gian tin nhắn cuối
    List<ChatRoom> findBySenderIdOrderByLastMessageAtDesc(Long senderId);
}