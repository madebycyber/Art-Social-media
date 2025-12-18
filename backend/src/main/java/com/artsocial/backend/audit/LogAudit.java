package com.artsocial.backend.audit;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface LogAudit {
    String action(); // Mô tả hành động (ví dụ: "UPLOAD_ARTWORK")
}