package com.example.demo.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;


@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // 1. Tắt CSRF và bật CORS mặc định
            .csrf(AbstractHttpConfigurer::disable)
            .cors(Customizer.withDefaults())
            
            // 2. Không lưu Session trên Server (Stateless JWT)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            
            // 3. Cấu hình Phân quyền API
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll() // Preflight
                .requestMatchers("/api/v1/auth/**").permitAll()        // Auth APIs (có v1)
                .requestMatchers("/api/auth/**").permitAll()         // Auth APIs không có v1
                .requestMatchers("/api/v1/bookings/**").permitAll() 
                .requestMatchers("/ws-cinema/**").permitAll()        // WebSocket STOMP Handshake
                .requestMatchers("/api/cinemas/**").permitAll()        // Cinema module APIs
                .requestMatchers("/api/cities/**").permitAll()
                .requestMatchers("/api/halls/**").permitAll()
                .requestMatchers("/api/seats/**").permitAll()
                .requestMatchers("/api/v1/movies/**").permitAll()      // Movie module APIs
                .requestMatchers("/api/v1/genres/**").permitAll()
                .requestMatchers("/api/v1/showtimes/**").permitAll()   // Showtime module APIs
                
                // === BỔ SUNG QUYỀN CHO F&B (CONCESSIONS) & COUPONS ===
                .requestMatchers("/api/concessions/manage/**").hasRole("ADMIN") // Quản lý F&B yêu cầu ADMIN
                .requestMatchers("/api/concessions/**").permitAll()            // Xem menu & tính tiền cho phép tất cả
                .requestMatchers("/api/coupons/manage/**").hasRole("ADMIN")     // Quản lý Coupon yêu cầu ADMIN
                .requestMatchers("/api/coupons/**").permitAll()                // Kiểm tra mã giảm giá cho phép tất cả
                // ====================================================

                .requestMatchers("/api/v1/reviews/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/v1/reviews/**").permitAll()
                .requestMatchers("/api/v1/users/**").authenticated()
                .requestMatchers("/api/v1/notifications/**").authenticated()
                .requestMatchers("/api/v1/roles/**").hasRole("ADMIN")
                .requestMatchers("/api/v1/permissions/**").hasRole("ADMIN")
                .anyRequest().authenticated()                       // Các API khác cần Token
            );

        // 4. Đặt JwtAuthenticationFilter trước UsernamePasswordAuthenticationFilter
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}