package com.example.demo.module.user.controller;

import com.example.demo.module.user.dto.request.AssignRolesRequest;
import com.example.demo.module.user.dto.request.ChangePasswordRequest;
import com.example.demo.module.user.dto.request.UpdateProfileRequest;
import com.example.demo.module.user.dto.request.UpdateUserStatusRequest;
import com.example.demo.module.user.dto.response.UserResponse;
import com.example.demo.module.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @PreAuthorize("hasAuthority('PROFILE_READ')")
    public ResponseEntity<UserResponse> getMyProfile(
            Authentication authentication) {
        return ResponseEntity.ok(
                userService.getUserProfileByEmail(authentication.getName()));
    }

    @PutMapping("/me")
    @PreAuthorize("hasAuthority('PROFILE_UPDATE')")
    public ResponseEntity<UserResponse> updateMyProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(
                userService.updateProfile(authentication.getName(), request));
    }

    @PutMapping("/me/change-password")
    @PreAuthorize("hasAuthority('PASSWORD_CHANGE')")
    public ResponseEntity<Void> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(authentication.getName(), request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @PreAuthorize("hasAuthority('USER_READ')")
    public ResponseEntity<Page<UserResponse>> getAllUsers(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(userService.getAllUsers(pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_READ')")
    public ResponseEntity<UserResponse> getUserById(
            @PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('USER_UPDATE_STATUS')")
    public ResponseEntity<UserResponse> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        return ResponseEntity.ok(
                userService.updateUserStatus(id, request));
    }

    @PutMapping("/{id}/roles")
    @PreAuthorize("hasAuthority('USER_ASSIGN_ROLES')")
    public ResponseEntity<UserResponse> assignRoles(
            @PathVariable Long id,
            @Valid @RequestBody AssignRolesRequest request) {
        return ResponseEntity.ok(userService.assignRoles(id, request));
    }
}