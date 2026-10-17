
package com.example.demo.module.user.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Set;

@Data
public class UpdateRolePermissionsRequest {

    @NotNull(message = "Danh sách quyền không được null")
    private Set<Long> permissionIds;
}
