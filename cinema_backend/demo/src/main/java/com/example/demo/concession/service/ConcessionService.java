package com.example.demo.concession.service;

import com.example.demo.entity.Concession;
import com.example.demo.concession.repository.ConcessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ConcessionService {

    private final ConcessionRepository concessionRepository;

    // 1. Khách hàng xem thực đơn đang bán (chỉ lấy các món active)
    public List<Concession> getActiveMenu() {
        return concessionRepository.findByIsActiveTrue();
    }

    // 2. Nhân viên xem toàn bộ danh sách món (cả active và không active)
    public List<Concession> getAllConcessionsForStaff() {
        return concessionRepository.findAll();
    }

    // 3. Lấy chi tiết một món ăn theo ID (phục vụ việc chỉnh sửa trên giao diện)
    public Optional<Concession> getConcessionById(Long id) {
        return concessionRepository.findById(id);
    }

    // 4. Nhân viên thêm sản phẩm mới hoặc cập nhật thông tin
    public Concession saveOrUpdateConcession(Concession concession) {
        return concessionRepository.save(concession);
    }

    // 5. Xóa món ăn theo ID (thường được dùng ở trang quản lý Frontend)
    public void deleteConcession(Long id) {
        concessionRepository.deleteById(id);
    }

    // 6. Xử lý tính tiền tổng giỏ hàng F&B khi khách đặt hàng
    public BigDecimal calculateCartTotal(Map<Long, Integer> cart) {
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (Map.Entry<Long, Integer> entry : cart.entrySet()) {
            Long concessionId = entry.getKey();
            Integer quantity = entry.getValue();

            Concession item = concessionRepository.findById(concessionId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy món ăn ID: " + concessionId));

            totalAmount = totalAmount.add(item.getPrice().multiply(BigDecimal.valueOf(quantity)));
        }

        return totalAmount;
    }
}