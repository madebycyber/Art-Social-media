package com.artsocial.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Endpoint để Frontend kết nối vào: http://localhost:5000/ws
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Cho phép React kết nối
                .withSockJS(); // Hỗ trợ fallback nếu trình duyệt không có WS
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Prefix cho các message gửi từ Client lên Server
        registry.setApplicationDestinationPrefixes("/app");
        // Prefix cho các message gửi từ Server về Client (User subscribe cái này)
        registry.enableSimpleBroker("/user", "/topic");
        registry.setUserDestinationPrefix("/user");
    }
}