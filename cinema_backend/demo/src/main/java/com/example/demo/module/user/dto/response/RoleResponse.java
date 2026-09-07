package com.example.demo.module.user.dto.response;

import com.example.demo.common.enums.RoleName;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoleResponse {

    private Long id;
    private RoleName name;
}
