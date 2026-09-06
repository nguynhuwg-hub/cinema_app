package com.example.demo.module.movie.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateCommentRequest {

    @NotNull(message = "User ID không được để trống")
    private Long userId;

    private Long parentCommentId; // Null nếu là bình luận gốc, truyền ID nếu là reply

    @Max(value = 5, message = "Đánh giá tối đa 5 sao")
    @Min(value = 1, message = "Đánh giá tối thiểu 1 sao")
    private Integer rating; // Có thể null nếu chỉ reply

    @NotBlank(message = "Nội dung bình luận không được để trống")
    private String content;
}
