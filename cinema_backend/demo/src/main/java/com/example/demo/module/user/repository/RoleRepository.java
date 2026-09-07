package com.example.demo.module.user.repository;

import com.example.demo.common.enums.RoleName;
import com.example.demo.module.user.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Set;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByName(RoleName name);

    Set<Role> findByNameIn(Set<RoleName> names);
}
