package com.example.demo.module.user.dto.request;

import com.example.demo.common.enums.RoleName;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignRolesRequest {

    @NotEmpty(message = "Danh sách vai trò không được để trống")
    private Set<RoleName> roleNames;
}
