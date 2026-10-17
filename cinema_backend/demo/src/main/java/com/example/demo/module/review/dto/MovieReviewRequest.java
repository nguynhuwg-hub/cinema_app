package com.example.demo.module.review.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovieReviewRequest {

    @NotNull(message = "Phim không được để trống")
    private Long movieId;

    @NotBlank(message = "Thể loại bài viết không được để trống")
    @Size(max = 40, message = "Thể loại bài viết không được vượt quá 40 ký tự")
    private String category;

    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 200, message = "Tiêu đề không được vượt quá 200 ký tự")
    private String title;

    @NotBlank(message = "Tóm tắt không được để trống")
    @Size(max = 500, message = "Tóm tắt không được vượt quá 500 ký tự")
    private String excerpt;

    @NotBlank(message = "Nội dung bài viết không được để trống")
    private String content;

    @NotBlank(message = "Tên tác giả không được để trống")
    @Size(max = 100, message = "Tên tác giả không được vượt quá 100 ký tự")
    private String authorName;

    @NotBlank(message = "Vai trò tác giả không được để trống")
    @Size(max = 120, message = "Vai trò tác giả không được vượt quá 120 ký tự")
    private String authorRole;

    @DecimalMin(value = "0.0", message = "Điểm đánh giá tối thiểu là 0")
    @DecimalMax(value = "5.0", message = "Điểm đánh giá tối đa là 5")
    private Float rating;
}
