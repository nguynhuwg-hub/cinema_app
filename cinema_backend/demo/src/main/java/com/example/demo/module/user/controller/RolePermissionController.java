
package com.example.demo.module.user.controller;

import com.example.demo.module.user.dto.request.UpdateRolePermissionsRequest;
import com.example.demo.module.user.entity.Permission;
import com.example.demo.module.user.service.RolePermissionService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1")
public class RolePermissionController {

    private final RolePermissionService rolePermissionService;

    @GetMapping("/permissions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Permission>> getAllPermissions() {
        return ResponseEntity.ok(
                rolePermissionService.getAllPermissions());
    }

    @GetMapping("/roles/{roleId}/permissions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Set<Permission>> getRolePermissions(
            @PathVariable Long roleId) {

        return ResponseEntity.ok(
                rolePermissionService.getRolePermissions(roleId));
    }

    @PutMapping("/roles/{roleId}/permissions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Set<Permission>> updateRolePermissions(
            @PathVariable Long roleId,
            @Valid @RequestBody UpdateRolePermissionsRequest request) {

        return ResponseEntity.ok(
                rolePermissionService.updateRolePermissions(
                        roleId,
                        request.getPermissionIds()
                )
        );
    }

    @PostMapping("/roles/{roleId}/permissions/{permissionId}")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<Void> addPermission(
        @PathVariable Long roleId,
        @PathVariable Long permissionId) {

    rolePermissionService.addPermission(roleId, permissionId);

    return ResponseEntity.noContent().build();
}


@DeleteMapping("/roles/{roleId}/permissions/{permissionId}")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<Void> removePermission(
        @PathVariable Long roleId,
        @PathVariable Long permissionId) {

    rolePermissionService.removePermission(roleId, permissionId);

    return ResponseEntity.noContent().build();
}
}
