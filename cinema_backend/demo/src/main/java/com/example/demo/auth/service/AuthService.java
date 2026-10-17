package com.example.demo.auth.service;

import com.example.demo.auth.dto.JwtAuthResponse;
import com.example.demo.auth.dto.LoginRequest;
import com.example.demo.auth.dto.RegisterRequest;
import com.example.demo.auth.dto.TokenRefreshRequest;
import jakarta.servlet.http.HttpServletRequest;

public interface AuthService {

    /**
     * Đăng ký tài khoản người dùng mới (Mặc định vai trò CUSTOMER).
     * Tạo bản ghi user với status UNVERIFIED và gửi token kích hoạt email.
     * 
     * @param request Thông tin đăng ký từ client (email, password, fullName, phone)
     * @return Mã token xác thực email (hoặc thông báo kết quả)
     */
    String register(RegisterRequest request);

    /**
     * Kích hoạt tài khoản người dùng thông qua token nhận được từ Email.
     * Chuyển status người dùng từ UNVERIFIED sang ACTIVE.
     * 
     * @param token Mã kích hoạt email
     * @return Thông báo kích hoạt thành công
     */
    String verifyEmail(String token);

    /**
     * Xác thực người dùng, kiểm tra chống Brute-force (dựa trên IP và Email).
     * Sinh cặp Access Token (JWT) và Refresh Token mới.
     * 
     * @param request Thông tin đăng nhập (email, password)
     * @param httpRequest Đối tượng request để lấy IP address của Client
     * @return DTO chứa thông tin user, Access Token và Refresh Token
     */
    JwtAuthResponse login(LoginRequest request, HttpServletRequest httpRequest);

    /**
     * Cấp lại Access Token mới bằng Refresh Token hợp lệ (Cơ chế Refresh Token Rotation).
     * Vô hiệu hóa Refresh Token cũ và tạo Refresh Token mới.
     * 
     * @param request DTO chứa refreshToken từ Client
     * @param httpRequest Đối tượng request để ghi nhận IP người dùng
     * @return DTO chứa cặp Access Token và Refresh Token mới
     */
    JwtAuthResponse refreshToken(TokenRefreshRequest request, HttpServletRequest httpRequest);

    /**
     * Đăng xuất người dùng bằng cách thu hồi/xóa Refresh Token trong Database.
     * 
     * @param refreshToken Mã Refresh Token cần thu hồi
     */
    void logout(String refreshToken);
}
