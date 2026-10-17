package com.example.demo.module.user.service;

import com.example.demo.module.user.dto.response.RoleResponse;
import java.util.List;

public interface RoleService {
    List<RoleResponse> getAllRoles();
}
