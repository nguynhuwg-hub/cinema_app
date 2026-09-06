package com.example.demo.auth.controller;

import com.example.demo.auth.dto.*;
import com.example.demo.auth.service.AuthService;
import com.example.demo.common.payload.ApiResponse; // Sử dụng nếu bạn có lớp bọc ApiResponse chung
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*") // Hỗ trợ kết nối Cross-Origin từ React Web và React Native
public class AuthController {

    @Autowired
    private AuthService authService;

    /**
     * Endpoint đăng ký tài khoản người dùng mới (Customer)
     * POST /api/v1/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<String>> register(@Valid @RequestBody RegisterRequest request) {
        String verificationToken = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.", 
                        verificationToken
                ));
    }

    /**
     * Endpoint xác minh email qua token được gửi tới Mail/Console
     * GET /api/v1/auth/verify-email?token=...
     */
    @GetMapping("/verify-email")
    public ResponseEntity<ApiResponse<String>> verifyEmail(@RequestParam("token") String token) {
        String message = authService.verifyEmail(token);
        return ResponseEntity.ok(ApiResponse.success(message, null));
    }

    /**
     * Endpoint đăng nhập hệ thống (Cấp Access Token & Refresh Token)
     * POST /api/v1/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<JwtAuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        
        JwtAuthResponse authResponse = authService.login(request, httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công!", authResponse));
    }

    /**
     * Endpoint làm mới Access Token khi đã hết hạn bằng Refresh Token (Token Rotation)
     * POST /api/v1/auth/refresh-token
     */
    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<JwtAuthResponse>> refreshToken(
            @Valid @RequestBody TokenRefreshRequest request,
            HttpServletRequest httpRequest) {
        
        JwtAuthResponse authResponse = authService.refreshToken(request, httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Cấp lại Access Token thành công!", authResponse));
    }

    /**
     * Endpoint đăng xuất tài khoản
     * POST /api/v1/auth/logout
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(@RequestHeader(value = "Authorization", required = false) String bearerToken) {
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            String token = bearerToken.substring(7);
            authService.logout(token);
        }
        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công!", null));
    }
}