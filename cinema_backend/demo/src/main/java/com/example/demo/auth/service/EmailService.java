package com.example.demo.auth.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.backend.url}")
    private String backendUrl;

    /**
     * Gửi email chứa link kích hoạt tài khoản bất đồng bộ (@Async)
     */
    @Async
    public void sendVerificationEmail(String toEmail, String recipientName, String token) {
        String verificationUrl = backendUrl + "/api/v1/auth/verify-email?token=" + token;

        String htmlContent = "<div style=\"font-family: Arial, sans-serif; padding: 20px;\">"
                + "<h2>Xác thực tài khoản của bạn</h2>"
                + "<p>Xin chào <b>" + recipientName + "</b>,</p>"
                + "<p>Cảm ơn bạn đã đăng ký tài khoản. Vui lòng nhấn vào nút bên dưới để kích hoạt tài khoản (Link có hiệu lực trong 30 phút):</p>"
                + "<a href=\"" + verificationUrl + "\" style=\"background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;\">Kích hoạt tài khoản</a>"
                + "<p>Nếu nút trên không hoạt động, bạn có thể copy link sau dán vào trình duyệt:</p>"
                + "<p><a href=\"" + verificationUrl + "\">" + verificationUrl + "</a></p>"
                + "</div>";

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Xác thực địa chỉ Email - Đăng ký tài khoản");
            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Lỗi khi gửi email xác thực: " + e.getMessage());
        }
    }
}