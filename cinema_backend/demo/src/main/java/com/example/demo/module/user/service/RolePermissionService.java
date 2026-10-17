
package com.example.demo.module.user.service;

import com.example.demo.module.user.entity.Permission;
import com.example.demo.module.user.entity.Role;
import com.example.demo.module.user.repository.PermissionRepository;
import com.example.demo.module.user.repository.RoleRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class RolePermissionService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    @Transactional(readOnly = true)
    public List<Permission> getAllPermissions() {
        return permissionRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Set<Permission> getRolePermissions(Long roleId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Role không tồn tại"));

        return role.getPermissions();
    }

    @Transactional
    public Set<Permission> updateRolePermissions(
            Long roleId,
            Set<Long> permissionIds) {

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Role không tồn tại"));

        Set<Permission> permissions =
                permissionRepository.findByIdIn(permissionIds);

        if (permissions.size() != permissionIds.size()) {
            throw new IllegalArgumentException(
                    "Danh sách chứa Permission không tồn tại");
        }

        role.setPermissions(new HashSet<>(permissions));

        roleRepository.save(role);

        return role.getPermissions();
    }

    @Transactional
public void addPermission(Long roleId, Long permissionId) {

    Role role = roleRepository.findById(roleId)
            .orElseThrow(() ->
                    new IllegalArgumentException("Role không tồn tại"));

    Permission permission = permissionRepository.findById(permissionId)
            .orElseThrow(() ->
                    new IllegalArgumentException("Permission không tồn tại"));

    role.getPermissions().add(permission);
    roleRepository.save(role);
}

@Transactional
public void removePermission(Long roleId, Long permissionId) {

    Role role = roleRepository.findById(roleId)
            .orElseThrow(() ->
                    new IllegalArgumentException("Role không tồn tại"));

    Permission permission = permissionRepository.findById(permissionId)
            .orElseThrow(() ->
                    new IllegalArgumentException("Permission không tồn tại"));

    role.getPermissions().removeIf(
            p -> p.getId().equals(permission.getId())
    );

    roleRepository.save(role);
}
}
