
package com.example.demo.module.user.service;

import com.example.demo.common.enums.RoleName;
import com.example.demo.module.user.entity.Permission;
import com.example.demo.module.user.entity.Role;
import com.example.demo.module.user.repository.PermissionRepository;
import com.example.demo.module.user.repository.RoleRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RolePermissionService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    // Các permission thiết yếu phải giữ cho ROLE_ADMIN.
    // Đây đều là những mã đã có trong danh mục permission.
    private static final Set<String> ADMIN_REQUIRED_PERMISSIONS =
            Set.of(
                    "ROLE_READ",
                    "USER_READ",
                    "USER_ASSIGN_ROLES"
            );

    @Transactional(readOnly = true)
    public List<Permission> getAllPermissions() {
        return permissionRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Set<Permission> getRolePermissions(Long roleId) {
        Role role = findRole(roleId);
        return role.getPermissions();
    }

    @Transactional
    public Set<Permission> updateRolePermissions(
            Long roleId,
            Set<Long> permissionIds
    ) {
        Role role = findRole(roleId);

        if (permissionIds == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Danh sách Permission không được null"
            );
        }

        Set<Permission> permissions =
                permissionRepository.findByIdIn(permissionIds);

        if (permissions.size() != permissionIds.size()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Danh sách chứa Permission không tồn tại"
            );
        }

        validateAdminPermissions(role, permissions);

        role.setPermissions(new HashSet<>(permissions));
        roleRepository.save(role);

        return role.getPermissions();
    }

    @Transactional
    public void addPermission(Long roleId, Long permissionId) {
        Role role = findRole(roleId);
        Permission permission = findPermission(permissionId);

        role.getPermissions().add(permission);

        // Bảo vệ tính hợp lệ sau thay đổi
        validateAdminPermissions(role, role.getPermissions());

        roleRepository.save(role);
    }

    @Transactional
    public void removePermission(Long roleId, Long permissionId) {
        Role role = findRole(roleId);
        Permission permission = findPermission(permissionId);

        Set<Permission> updated =
                new HashSet<>(role.getPermissions());

        updated.removeIf(
                p -> p.getId().equals(permission.getId())
        );

        validateAdminPermissions(role, updated);

        role.setPermissions(updated);
        roleRepository.save(role);
    }

    private Role findRole(Long roleId) {
        return roleRepository.findById(roleId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Role không tồn tại"
                        )
                );
    }

    private Permission findPermission(Long permissionId) {
        return permissionRepository.findById(permissionId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Permission không tồn tại"
                        )
                );
    }

    private void validateAdminPermissions(
            Role role,
            Set<Permission> permissions
    ) {
        if (role.getName() != RoleName.ROLE_ADMIN) {
            return;
        }

        Set<String> codes = permissions.stream()
                .map(Permission::getCode)
                .collect(Collectors.toSet());

        if (!codes.containsAll(ADMIN_REQUIRED_PERMISSIONS)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Không được thu hồi các quyền quản trị thiết yếu"
            );
        }
    }
}
