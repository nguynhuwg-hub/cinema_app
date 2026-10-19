
package com.example.demo.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import jakarta.servlet.DispatcherType;

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
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authConfig
    ) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(Customizer.withDefaults())

            .sessionManagement(session ->
                session.sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS
                )
            )

            .authorizeHttpRequests(auth -> auth

                // Cho phép Spring Boot xử lý lỗi nội bộ
                .dispatcherTypeMatchers(
                    DispatcherType.ERROR
                ).permitAll()

                // CORS preflight
                .requestMatchers(
                    HttpMethod.OPTIONS,
                    "/**"
                ).permitAll()

                // Error endpoint
                .requestMatchers("/error").permitAll()

                // Authentication APIs
                .requestMatchers(
                    "/api/v1/auth/**",
                    "/api/auth/**"
                ).permitAll()

                // VNPay callbacks
                // Chữ ký VNPay vẫn phải được xác thực
                // tại tầng xử lý callback
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/v1/payments/vnpay/ipn",
                    "/api/v1/payments/vnpay/return"
                ).permitAll()

                // Booking
                .requestMatchers(
                    "/api/v1/bookings/**"
                ).authenticated()

                // Ticket check-in
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/v1/tickets/check-in"
                ).hasAnyRole(
                    "STAFF",
                    "MANAGER",
                    "ADMIN"
                )

                // Các API ticket khác
                .requestMatchers(
                    "/api/v1/tickets/**"
                ).authenticated()

                // Payment
                .requestMatchers(
                    "/api/v1/payments/**"
                ).authenticated()

                // Showtime seat management
                .requestMatchers(
                    HttpMethod.PATCH,
                    "/api/v1/showtimes/*/seats/status"
                ).authenticated()

                // WebSocket
                .requestMatchers(
                    "/ws-cinema/**"
                ).permitAll()

                // Cinema APIs
                .requestMatchers(
                    "/api/cinemas/**",
                    "/api/cities/**",
                    "/api/halls/**",
                    "/api/seats/**"
                ).permitAll()

                // Public movie APIs: chỉ đọc
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/v1/movies/**"
                ).permitAll()

                // Public genre APIs: chỉ đọc
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/v1/genres/**"
                ).permitAll()

                // Public showtime APIs: chỉ đọc
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/v1/showtimes/**"
                ).permitAll()

                // Movie management:
                // Yêu cầu đăng nhập, quyền chi tiết
                // được kiểm tra tại Controller/Service
                .requestMatchers(
                    "/api/v1/movies/**"
                ).authenticated()

                // Genre management
                .requestMatchers(
                    "/api/v1/genres/**"
                ).authenticated()

                // Showtime management
                .requestMatchers(
                    "/api/v1/showtimes/**"
                ).authenticated()

                // Review management
                .requestMatchers(
                    "/api/v1/reviews/admin/**"
                ).hasAnyRole(
                    "MANAGER",
                    "ADMIN"
                )

                // Public review reading
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/v1/reviews/**"
                ).permitAll()

                // Other review operations require login
                .requestMatchers(
                    "/api/v1/reviews/**"
                ).authenticated()

                // User and notifications
                .requestMatchers(
                    "/api/v1/users/**",
                    "/api/v1/notifications/**"
                ).authenticated()

                // Role and permission management
                .requestMatchers(
                    "/api/v1/roles/**",
                    "/api/v1/permissions/**"
                ).hasRole("ADMIN")

                // Remaining APIs
                .anyRequest().authenticated()
            );

        http.addFilterBefore(
            jwtAuthenticationFilter,
            UsernamePasswordAuthenticationFilter.class
        );

        return http.build();
    }
}
