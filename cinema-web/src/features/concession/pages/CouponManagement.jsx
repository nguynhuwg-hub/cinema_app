import React, { useState, useEffect } from 'react';
import { couponApi } from '../api/couponApi';

const CouponManagement = () => {
    const [coupons, setCoupons] = useState([]);
    const [formData, setFormData] = useState({ 
        code: '', 
        discountAmount: '', 
        minOrderValue: '', 
        startDate: '', 
        endDate: '', 
        usageLimit: '', 
        active: true 
    });
    
    const [testCode, setTestCode] = useState('');
    const [orderTotal, setOrderTotal] = useState('');
    const [discountResult, setDiscountResult] = useState(null);

    const fetchCoupons = async () => {
        try {
            const data = await couponApi.getManageList();
            setCoupons(data);
        } catch (error) {
            console.error("Lỗi khi tải danh sách mã giảm giá:", error);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await couponApi.saveCoupon(formData);
            alert('Tạo mã giảm giá thành công!');
            setFormData({ code: '', discountAmount: '', minOrderValue: '', startDate: '', endDate: '', usageLimit: '', active: true });
            fetchCoupons();
        } catch (error) {
            console.error("Lỗi khi lưu coupon:", error);
            alert('Tạo mã giảm giá thất bại!');
        }
    };

    const handleApplyCoupon = async () => {
        try {
            const result = await couponApi.validateCoupon(testCode, orderTotal);
            setDiscountResult(`Thành công! Số tiền được giảm: ${Number(result).toLocaleString()} VNĐ`);
        } catch (error) {
            console.error("Lỗi áp dụng coupon:", error);
            setDiscountResult(error.response?.data || 'Mã giảm giá không hợp lệ, chưa đến hạn hoặc đã hết lượt dùng.');
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1100px', margin: '0 auto' }}>
            <h2>Quản lý Mã Giảm Giá (Coupon)</h2>

            <form onSubmit={handleSubmit} style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', border: '1px solid #dee2e6' }}>
                <input 
                    type="text" 
                    placeholder="Mã Code (VD: SUMMER2026)" 
                    value={formData.code} 
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} 
                    required 
                    style={{ padding: '10px', flex: '1 1 180px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <input 
                    type="number" 
                    placeholder="Số tiền giảm (VNĐ)" 
                    value={formData.discountAmount} 
                    onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })} 
                    required 
                    style={{ padding: '10px', flex: '1 1 150px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <input 
                    type="number" 
                    placeholder="Đơn tối thiểu (VNĐ)" 
                    value={formData.minOrderValue} 
                    onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })} 
                    style={{ padding: '10px', flex: '1 1 150px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>Thời gian bắt đầu:</label>
                    <input 
                        type="datetime-local" 
                        value={formData.startDate} 
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} 
                        required 
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>
                <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>Thời gian kết thúc:</label>
                    <input 
                        type="datetime-local" 
                        value={formData.endDate} 
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} 
                        required 
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>
                <input 
                    type="number" 
                    placeholder="Giới hạn lượt dùng" 
                    value={formData.usageLimit} 
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })} 
                    style={{ padding: '10px', flex: '1 1 140px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <div style={{ width: '100%', marginTop: '5px' }}>
                    <button type="submit" style={{ background: '#28a745', color: 'white', border: 'none', padding: '10px 20px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>
                        Tạo mã giảm giá mới
                    </button>
                </div>
            </form>

            <div style={{ background: '#e9ecef', padding: '15px', borderRadius: '8px', marginBottom: '25px', border: '1px solid #ced4da' }}>
                <h4 style={{ margin: '0 0 10px 0' }}>Kiểm tra áp dụng mã giảm giá (Mô phỏng thanh toán)</h4>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <input 
                        type="text" 
                        placeholder="Nhập mã coupon" 
                        value={testCode} 
                        onChange={(e) => setTestCode(e.target.value.toUpperCase())} 
                        style={{ padding: '8px', flex: '1 1 200px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <input 
                        type="number" 
                        placeholder="Tổng tiền đơn hàng (VNĐ)" 
                        value={orderTotal} 
                        onChange={(e) => setOrderTotal(e.target.value)} 
                        style={{ padding: '8px', flex: '1 1 200px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <button onClick={handleApplyCoupon} style={{ background: '#007bff', color: 'white', border: 'none', padding: '8px 16px', cursor: 'pointer', borderRadius: '4px' }}>
                        Kiểm tra mã
                    </button>
                </div>
                {discountResult && <p style={{ marginTop: '10px', fontWeight: 'bold', color: discountResult.includes('Thành công') ? 'green' : 'red' }}>{discountResult}</p>}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <thead>
                    <tr style={{ background: '#343a40', color: 'white', textAlign: 'left' }}>
                        <th style={{ padding: '12px' }}>ID</th>
                        <th style={{ padding: '12px' }}>Mã Code</th>
                        <th style={{ padding: '12px' }}>Giảm giá</th>
                        <th style={{ padding: '12px' }}>Đơn tối thiểu</th>
                        <th style={{ padding: '12px' }}>Thời hạn</th>
                        <th style={{ padding: '12px' }}>Đã dùng / Giới hạn</th>
                        <th style={{ padding: '12px' }}>Trạng thái</th>
                    </tr>
                </thead>
                <tbody>
                    {coupons.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                            <td style={{ padding: '12px' }}>{item.id}</td>
                            <td style={{ padding: '12px', fontWeight: 'bold', color: '#007bff' }}>{item.code}</td>
                            <td style={{ padding: '12px' }}>{Number(item.discountAmount).toLocaleString()} đ</td>
                            <td style={{ padding: '12px' }}>{Number(item.minOrderValue || 0).toLocaleString()} đ</td>
                            <td style={{ padding: '12px', fontSize: '13px' }}>{item.startDate} <br/>đến {item.endDate}</td>
                            <td style={{ padding: '12px' }}>{item.usedCount} / {item.usageLimit || 'Không giới hạn'}</td>
                            <td style={{ padding: '12px' }}>
                                {item.active ? 
                                    <span style={{ color: 'green', fontWeight: 'bold' }}>● Hoạt động</span> : 
                                    <span style={{ color: 'red', fontWeight: 'bold' }}>● Đã khóa</span>
                                }
                            </td>
                        </tr>
                    ))}
                    {coupons.length === 0 && (
                        <tr>
                            <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>Chưa có mã giảm giá nào trong hệ thống.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default CouponManagement;