
package com.example.demo.module.user.repository;

import com.example.demo.module.user.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Set;

@Repository
public interface PermissionRepository
        extends JpaRepository<Permission, Long> {

    Set<Permission> findByIdIn(Set<Long> ids);

    boolean existsByCode(String code);
}
