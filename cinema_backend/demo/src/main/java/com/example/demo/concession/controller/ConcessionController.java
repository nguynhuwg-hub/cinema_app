package com.example.demo.concession.controller;

import com.example.demo.entity.Concession;
import com.example.demo.concession.service.ConcessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/concessions")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ConcessionController {

    private final ConcessionService concessionService;

    @GetMapping("/menu")
    public ResponseEntity<List<Concession>> getMenu() {
        return ResponseEntity.ok(concessionService.getActiveMenu());
    }

    @GetMapping("/manage/list")
    public ResponseEntity<List<Concession>> getManageList() {
        return ResponseEntity.ok(concessionService.getAllConcessionsForStaff());
    }

    @PostMapping("/manage/save")
    public ResponseEntity<Concession> saveConcession(@RequestBody Concession concession) {
        return ResponseEntity.ok(concessionService.saveOrUpdateConcession(concession));
    }

    @PostMapping("/calculate-total")
    public ResponseEntity<BigDecimal> calculateTotal(@RequestBody Map<Long, Integer> cart) {
        return ResponseEntity.ok(concessionService.calculateCartTotal(cart));
    }
}