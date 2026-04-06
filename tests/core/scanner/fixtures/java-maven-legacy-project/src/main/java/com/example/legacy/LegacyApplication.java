package com.example.legacy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Legacy Application - JDK 8 + Spring Boot 2.x
 *
 * This is a test fixture for testing JDK 8 legacy compatibility detection.
 */
@SpringBootApplication
public class LegacyApplication {

    public static void main(String[] args) {
        SpringApplication.run(LegacyApplication.class, args);
    }
}