package com.artsocial.backend.audit;

import com.google.gson.Gson;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Aspect
@Component
public class AuditAspect {

    private final Gson gson = new Gson();
    private final String LOG_FILE = "audit_logs.json";

    @AfterReturning(pointcut = "@annotation(logAudit)", returning = "result")
    public void logAfter(JoinPoint joinPoint, LogAudit logAudit, Object result) {
        try {
            String username = "Anonymous";
            if (SecurityContextHolder.getContext().getAuthentication() != null) {
                username = SecurityContextHolder.getContext().getAuthentication().getName();
            }

            Map<String, Object> logData = new HashMap<>();
            logData.put("timestamp", LocalDateTime.now().toString());
            logData.put("user", username);
            logData.put("action", logAudit.action());
            logData.put("details", result.toString()); // Ghi lại kết quả trả về

            // Ghi nối tiếp vào file (Append mode)
            try (FileWriter fw = new FileWriter(LOG_FILE, true);
                 PrintWriter out = new PrintWriter(fw)) {
                out.println(gson.toJson(logData));
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}