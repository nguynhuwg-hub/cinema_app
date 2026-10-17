package com.example.demo.module.user.service;

import com.example.demo.module.user.dto.request.AssignRolesRequest;
import com.example.demo.module.user.dto.request.ChangePasswordRequest;
import com.example.demo.module.user.dto.request.UpdateProfileRequest;
import com.example.demo.module.user.dto.request.UpdateUserStatusRequest;
import com.example.demo.module.user.dto.response.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserService {
    UserResponse getUserProfileByEmail(String email);
    UserResponse getUserById(Long id);
    UserResponse updateProfile(String email, UpdateProfileRequest request);
    void changePassword(String email, ChangePasswordRequest request);
    Page<UserResponse> getAllUsers(Pageable pageable);
    UserResponse updateUserStatus(Long id, UpdateUserStatusRequest request);
    UserResponse assignRoles(Long id, AssignRolesRequest request);
}
