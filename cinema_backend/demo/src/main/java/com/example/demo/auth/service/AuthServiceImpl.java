package com.example.demo.auth.service;

import com.example.demo.common.enums.AccountStatus;
import com.example.demo.common.enums.RoleName;
import com.example.demo.common.exception.BadRequestException;
import com.example.demo.auth.dto.*;
import com.example.demo.auth.entity.*;
import com.example.demo.auth.repository.*;
import com.example.demo.module.user.entity.Role;
import com.example.demo.module.user.entity.User;
import com.example.demo.module.user.repository.RoleRepository;
import com.example.demo.module.user.repository.UserRepository;
import com.example.demo.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private EmailVerificationRepository emailVerificationRepository;

    @Autowired
    private LoginAttemptRepository loginAttemptRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Override
    @Transactional
    public String register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email đã được sử dụng!");
        }

        Role userRole = roleRepository.findByName(RoleName.ROLE_CUSTOMER)
                .orElseThrow(() -> new BadRequestException("Role không tồn tại!"));

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .status(AccountStatus.PENDING_VERIFICATION)
                .roles(Collections.singleton(userRole))
                .build();

        userRepository.save(user);

        // Tạo Email Verification Token
        String token = UUID.randomUUID().toString();
        EmailVerification verification = EmailVerification.builder()
                .user(user)
                .token(token)
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .build();

        emailVerificationRepository.save(verification);

        return token; 
    }

    @Override
    @Transactional
    public String verifyEmail(String token) {
        EmailVerification verification = emailVerificationRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Mã xác thực không hợp lệ!"));

        if (verification.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Mã xác thực đã hết hạn!");
        }

        User user = verification.getUser();
        user.setStatus(AccountStatus.ACTIVE);
        user.setEmailVerified(true);
        userRepository.save(user);

        emailVerificationRepository.delete(verification);
        return "Xác minh tài khoản thành công!";
    }

   @Override
    @Transactional
    public JwtAuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);

        // 1. Kiểm tra Brute-force
        long failedAttempts = loginAttemptRepository.countByEmailAndIpAddressAndSuccessFalseAndAttemptedAtAfter(
                request.getEmail(), clientIp, LocalDateTime.now().minusMinutes(15)
        );

        if (failedAttempts >= 5) {
            throw new BadRequestException("Bạn đã nhập sai quá 5 lần. Vui lòng thử lại sau 15 phút!");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            loginAttemptRepository.save(LoginAttempt.builder()
                    .email(request.getEmail()).ipAddress(clientIp).success(true).build());

        } catch (Exception ex) {
            loginAttemptRepository.save(LoginAttempt.builder()
                    .email(request.getEmail()).ipAddress(clientIp).success(false).build());

            throw new BadRequestException("Email hoặc mật khẩu không chính xác!");
        }

        User user = userRepository.findByEmail(request.getEmail()).orElseThrow();

        if (user.getStatus() == AccountStatus.PENDING_VERIFICATION) {
            throw new BadRequestException("Tài khoản chưa được kích hoạt email!");
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        // 2. Cấp Access Token (Có chứa Role mã hóa bên trong)
        String accessToken = tokenProvider.generateTokenFromUser(user);
        String rawRefreshToken = UUID.randomUUID().toString();

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(hashString(rawRefreshToken))
                .deviceName(httpRequest.getHeader("User-Agent"))
                .ipAddress(clientIp)
                .userAgent(httpRequest.getHeader("User-Agent"))
                .expiresAt(LocalDateTime.now().plusDays(7))
                .revoked(false)
                .build();

        refreshTokenRepository.save(refreshToken);

        // Lấy danh sách Roles trả ra JSON Response ngoài
        Set<String> roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toSet());

        return JwtAuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(rawRefreshToken)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(roles) // Trả về trường Roles riêng biệt ở JSON
                .build();
    }

    @Override
    @Transactional
    public JwtAuthResponse refreshToken(TokenRefreshRequest request, HttpServletRequest httpRequest) {
        String tokenHash = hashString(request.getRefreshToken());

        RefreshToken storedToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BadRequestException("Refresh token không hợp lệ!"));

        if (storedToken.isRevoked() || storedToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Refresh token đã hết hạn hoặc bị vô hiệu hóa!");
        }

        // Refresh Token Rotation
        storedToken.setRevoked(true);
        refreshTokenRepository.save(storedToken);

        User user = storedToken.getUser();
        
        // Sinh Access Token mới chứa mã hóa Role
        String newAccessToken = tokenProvider.generateTokenFromUser(user);
        String newRawRefreshToken = UUID.randomUUID().toString();

        RefreshToken newToken = RefreshToken.builder()
                .user(user)
                .tokenHash(hashString(newRawRefreshToken))
                .deviceName(httpRequest.getHeader("User-Agent"))
                .ipAddress(getClientIp(httpRequest))
                .userAgent(httpRequest.getHeader("User-Agent"))
                .expiresAt(LocalDateTime.now().plusDays(7))
                .revoked(false)
                .build();

        refreshTokenRepository.save(newToken);

        Set<String> roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toSet());

        return JwtAuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRawRefreshToken)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(roles) // Trả về trường Roles riêng biệt ở JSON
                .build();
    }

    @Override
    public void logout(String token) {
        // Cần thực thi logic cho Logout tại đây khi phát triển tiếp
    }

    private String hashString(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Lỗi mã hóa SHA-256", e);
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}