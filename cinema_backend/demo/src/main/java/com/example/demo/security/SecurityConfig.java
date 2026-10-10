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

@Configuration
@EnableWebSecurity
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
                .requestMatchers("/api/v1/auth/**").permitAll()        // Auth APIs
                .requestMatchers("/api/v1/bookings/**").permitAll() // <--- THÊM DÒNG NÀY ĐỂ UNBLOCK BOOKING
                .requestMatchers("/ws-cinema/**").permitAll()          // WebSocket STOMP Handshake
                .requestMatchers("/api/cinemas/**").permitAll()        // Cinema module APIs
                .requestMatchers("/api/cities/**").permitAll()
                .requestMatchers("/api/halls/**").permitAll()
                .requestMatchers("/api/seats/**").permitAll()
                .requestMatchers("/api/v1/movies/**").permitAll()      // Movie module APIs
                .requestMatchers("/api/v1/genres/**").permitAll()
                .requestMatchers("/api/v1/showtimes/**").permitAll()   // Showtime module APIs
                .requestMatchers("/api/v1/users/**").authenticated()
                .requestMatchers("/api/v1/notifications/**").authenticated()
                .requestMatchers("/api/v1/roles/**").permitAll()
                .anyRequest().authenticated()                          // Các API khác ngoài danh sách trên cần Token
            );

        // 4. Đặt JwtAuthenticationFilter trước UsernamePasswordAuthenticationFilter
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}