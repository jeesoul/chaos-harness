package com.example.legacy.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Legacy Controller - using javax.annotation (JDK 8 compatible)
 */
@RestController
public class LegacyController {

    @GetMapping("/hello")
    public String hello() {
        return "Hello from JDK 8 Legacy!";
    }
}