package com.artsocial.backend.service;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.Collections;
import java.util.List;

@Service
public class GeminiService {

    private final RestTemplate restTemplate;

    private final String API_KEY = "putyourapikeyhere"; 
    private final String API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + API_KEY;

    public GeminiService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public String callGemini(String userMessage) {
        try {

            GeminiRequest request = new GeminiRequest();
            request.setContents(Collections.singletonList(
                new Content(Collections.singletonList(new Part(userMessage)))
            ));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<GeminiRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<GeminiResponse> response = restTemplate.exchange(
                API_URL, HttpMethod.POST, entity, GeminiResponse.class
            );

            if (response.getBody() != null && !response.getBody().getCandidates().isEmpty()) {
                return response.getBody().getCandidates().get(0).getContent().getParts().get(0).getText();
            }
        } catch (Exception e) {
            e.printStackTrace();
            return "Xin lỗi, hệ thống AI đang quá tải. Vui lòng thử lại sau.";
        }
        return "Không nhận được phản hồi từ AI.";
    }

    // --- DTO nội bộ để map JSON của Google ---
    @Data @NoArgsConstructor static class GeminiRequest { private List<Content> contents; }
    @Data @NoArgsConstructor @AllArgsConstructor static class Content { private List<Part> parts; }
    @Data @NoArgsConstructor @AllArgsConstructor static class Part { private String text; }
    
    @Data @NoArgsConstructor static class GeminiResponse { private List<Candidate> candidates; }
    @Data @NoArgsConstructor static class Candidate { private Content content; }
}
