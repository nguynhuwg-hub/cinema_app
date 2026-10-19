import React, { useState, useEffect } from 'react';
import { couponApi } from '../api/couponApi';

const CouponManagement = () => {
    const [coupons, setCoupons] = useState([]);
    const [formData, setFormData] = useState({ 
        id: '',
        code: '', 
        discountValue: '', 
        minBookingAmount: '', 
        discountType: 'FIXED_AMOUNT', 
        startDate: '', 
        endDate: '', 
        usageLimit: '', 
        isActive: true 
    });
    const [isEditing, setIsEditing] = useState(false);
    
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

    const handleNumberChange = (field, value) => {
        const rawValue = value.replace(/\D/g, '');
        setFormData(prev => ({ ...prev, [field]: rawValue }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                id: formData.id || null,
                code: formData.code,
                discountType: formData.discountType,
                discountValue: formData.discountValue ? Number(formData.discountValue) : 0,
                minBookingAmount: formData.minBookingAmount ? Number(formData.minBookingAmount) : 0,
                usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
                startDate: formData.startDate ? (formData.startDate.length === 16 ? `${formData.startDate}:00` : formData.startDate) : null,
                endDate: formData.endDate ? (formData.endDate.length === 16 ? `${formData.endDate}:00` : formData.endDate) : null,
                isActive: formData.isActive
            };

            await couponApi.saveCoupon(payload);
            alert(isEditing ? 'Cập nhật mã giảm giá thành công!' : 'Tạo mã giảm giá thành công!');
            setFormData({ id: '', code: '', discountValue: '', minBookingAmount: '', discountType: 'FIXED_AMOUNT', startDate: '', endDate: '', usageLimit: '', isActive: true });
            setIsEditing(false);
            fetchCoupons();
        } catch (error) {
            console.error("Lỗi khi lưu coupon:", error.response?.data || error);
            alert('Lưu mã giảm giá thất bại! Vui lòng kiểm tra lại dữ liệu.');
        }
    };

    const handleEdit = (item) => {
        setFormData({
            id: item.id,
            code: item.code || '',
            discountValue: item.discountValue !== undefined ? String(item.discountValue) : '',
            minBookingAmount: item.minBookingAmount !== undefined ? String(item.minBookingAmount) : '',
            discountType: item.discountType || 'FIXED_AMOUNT',
            startDate: item.startDate ? item.startDate.substring(0, 16) : '',
            endDate: item.endDate ? item.endDate.substring(0, 16) : '',
            usageLimit: item.usageLimit !== undefined ? String(item.usageLimit) : '',
            isActive: item.isActive ?? item.active ?? true
        });
        setIsEditing(true);
    };

    const handleApplyCoupon = async () => {
        if (!testCode || !orderTotal) {
            setDiscountResult({
                success: false,
                message: 'Vui lòng nhập đầy đủ mã coupon và tổng tiền đơn hàng!'
            });
            return;
        }

        try {
            const discount = await couponApi.validateCoupon(testCode, orderTotal);
            const numericDiscount = Number(discount);

            if (numericDiscount > 0) {
                setDiscountResult({
                    success: true,
                    message: `Thành công! Số tiền được giảm: ${numericDiscount.toLocaleString('vi-VN')} VNĐ`
                });
            } else {
                setDiscountResult({
                    success: false,
                    message: 'Mã giảm giá chưa đến thời gian áp dụng, đã hết hạn hoặc không đủ điều kiện đơn hàng!'
                });
            }
        } catch (error) {
            console.error("Lỗi áp dụng coupon:", error);
            setDiscountResult({
                success: false,
                message: error.response?.data || 'Mã giảm giá không hợp lệ hoặc không tồn tại.'
            });
        }
    };

    return (
        <div style={{ padding: '30px', color: '#ffffff' }}>
            <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>COUPON MANAGEMENT</p>
                <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>Quản lý Mã Giảm Giá (Coupon)</h2>
            </div>

            <form onSubmit={handleSubmit} style={{ background: '#161b22', padding: '24px', borderRadius: '12px', marginBottom: '25px', display: 'flex', gap: '16px', flexWrap: 'wrap', border: '1px solid #30363d' }}>
                <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', color: '#aaa' }}>Mã Code</label>
                    <input 
                        type="text" 
                        placeholder="VD: SUMMER2026" 
                        value={formData.code} 
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} 
                        required 
                        style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #30363d', background: '#0d1117', color: '#fff', outline: 'none' }}
                    />
                </div>

                <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', color: '#aaa' }}>Số tiền giảm (VNĐ)</label>
                    <input 
                        type="text" 
                        placeholder="Nhập số tiền..." 
                        value={formData.discountValue ? Number(formData.discountValue).toLocaleString('vi-VN') : ''} 
                        onChange={(e) => handleNumberChange('discountValue', e.target.value)} 
                        required 
                        style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #30363d', background: '#0d1117', color: '#fff', outline: 'none' }}
                    />
                </div>

                <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', color: '#aaa' }}>Đơn tối thiểu (VNĐ)</label>
                    <input 
                        type="text" 
                        placeholder="Nhập đơn tối thiểu..." 
                        value={formData.minBookingAmount ? Number(formData.minBookingAmount).toLocaleString('vi-VN') : ''} 
                        onChange={(e) => handleNumberChange('minBookingAmount', e.target.value)} 
                        style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #30363d', background: '#0d1117', color: '#fff', outline: 'none' }}
                    />
                </div>

                <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', color: '#aaa' }}>Thời gian bắt đầu:</label>
                    <input 
                        type="datetime-local" 
                        value={formData.startDate} 
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} 
                        required 
                        style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #30363d', background: '#0d1117', color: '#fff', outline: 'none', colorScheme: 'dark' }}
                    />
                </div>

                <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', color: '#aaa' }}>Thời gian kết thúc:</label>
                    <input 
                        type="datetime-local" 
                        value={formData.endDate} 
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} 
                        required 
                        style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #30363d', background: '#0d1117', color: '#fff', outline: 'none', colorScheme: 'dark' }}
                    />
                </div>

                <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', color: '#aaa' }}>Giới hạn lượt dùng</label>
                    <input 
                        type="text" 
                        placeholder="Không giới hạn" 
                        value={formData.usageLimit} 
                        onChange={(e) => handleNumberChange('usageLimit', e.target.value)} 
                        style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #30363d', background: '#0d1117', color: '#fff', outline: 'none' }}
                    />
                </div>

                <div style={{ width: '100%', display: 'flex', gap: '10px', marginTop: '5px' }}>
                    <button type="submit" style={{ background: '#ff4d4f', color: 'white', border: 'none', padding: '10px 20px', cursor: 'pointer', borderRadius: '6px', fontWeight: 'bold' }}>
                        {isEditing ? 'Cập nhật mã giảm giá' : 'Tạo mã giảm giá mới'}
                    </button>
                    {isEditing && (
                        <button type="button" onClick={() => { setIsEditing(false); setFormData({ id: '', code: '', discountValue: '', minBookingAmount: '', discountType: 'FIXED_AMOUNT', startDate: '', endDate: '', usageLimit: '', isActive: true }); }} style={{ background: '#30363d', color: 'white', border: 'none', padding: '10px 20px', cursor: 'pointer', borderRadius: '6px' }}>
                            Hủy bỏ
                        </button>
                    )}
                </div>
            </form>

            <div style={{ background: '#161b22', padding: '20px', borderRadius: '12px', marginBottom: '25px', border: '1px solid #30363d' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#fff' }}>Kiểm tra áp dụng mã giảm giá (Mô phỏng thanh toán)</h4>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <input 
                        type="text" 
                        placeholder="Nhập mã coupon" 
                        value={testCode} 
                        onChange={(e) => setTestCode(e.target.value.toUpperCase())} 
                        style={{ padding: '10px 12px', flex: '1 1 200px', borderRadius: '6px', border: '1px solid #30363d', background: '#0d1117', color: '#fff', outline: 'none' }}
                    />
                    <input 
                        type="text" 
                        placeholder="Tổng tiền đơn hàng (VNĐ)" 
                        value={orderTotal ? Number(orderTotal).toLocaleString('vi-VN') : ''} 
                        onChange={(e) => setOrderTotal(e.target.value.replace(/\D/g, ''))} 
                        style={{ padding: '10px 12px', flex: '1 1 200px', borderRadius: '6px', border: '1px solid #30363d', background: '#0d1117', color: '#fff', outline: 'none' }}
                    />
                    <button onClick={handleApplyCoupon} style={{ background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', padding: '10px 16px', cursor: 'pointer', borderRadius: '6px', fontWeight: '500' }}>
                        Kiểm tra mã
                    </button>
                </div>
                {discountResult && (
                    <p style={{ marginTop: '12px', fontWeight: 'bold', color: discountResult.success ? '#2ea043' : '#f85149' }}>
                        {discountResult.message}
                    </p>
                )}
            </div>

            <div style={{ background: '#161b22', borderRadius: '12px', border: '1px solid #30363d', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#21262d', color: '#8b949e', borderBottom: '1px solid #30363d', fontSize: '13px' }}>
                            <th style={{ padding: '14px 16px' }}>ID</th>
                            <th style={{ padding: '14px 16px' }}>Mã Code</th>
                            <th style={{ padding: '14px 16px' }}>Giảm giá</th>
                            <th style={{ padding: '14px 16px' }}>Đơn tối thiểu</th>
                            <th style={{ padding: '14px 16px' }}>Thời hạn</th>
                            <th style={{ padding: '14px 16px' }}>Đã dùng / Giới hạn</th>
                            <th style={{ padding: '14px 16px' }}>Trạng thái</th>
                            <th style={{ padding: '14px 16px', textAlign: 'center' }}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {coupons.map((item) => {
                            const activeStatus = item.isActive ?? item.active ?? true;
                            return (
                                <tr key={item.id} style={{ borderBottom: '1px solid #30363d', fontSize: '14px' }}>
                                    <td style={{ padding: '14px 16px', color: '#8b949e' }}>{item.id}</td>
                                    <td style={{ padding: '14px 16px', fontWeight: 'bold', color: '#58a6ff' }}>{item.code}</td>
                                    <td style={{ padding: '14px 16px', color: '#ff4d4f', fontWeight: 'bold' }}>{Number(item.discountValue || 0).toLocaleString()} đ</td>
                                    <td style={{ padding: '14px 16px', color: '#ccc' }}>{Number(item.minBookingAmount || 0).toLocaleString()} đ</td>
                                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#aaa' }}>{item.startDate} <br/>đến {item.endDate}</td>
                                    <td style={{ padding: '14px 16px', color: '#ccc' }}>{item.usedCount || 0} / {item.usageLimit || 'Không giới hạn'}</td>
                                    <td style={{ padding: '14px 16px' }}>
                                        {activeStatus ? 
                                            <span style={{ color: '#2ea043', fontWeight: 'bold' }}>● Hoạt động</span> : 
                                            <span style={{ color: '#f85149', fontWeight: 'bold' }}>● Đã khóa</span>
                                        }
                                    </td>
                                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                        <button onClick={() => handleEdit(item)} style={{ background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', padding: '6px 14px', cursor: 'pointer', borderRadius: '6px', fontWeight: '500' }}>Sửa</button>
                                    </td>
                                </tr>
                            );
                        })}
                        {coupons.length === 0 && (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#8b949e' }}>Chưa có mã giảm giá nào trong hệ thống.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CouponManagement;