import React, { useState, useEffect } from 'react';
import { concessionApi } from '../api/concessionApi';
import { couponApi } from '../api/couponApi';

const CustomerOrderPage = () => {
    const [menu, setMenu] = useState([]);
    const [cart, setCart] = useState({}); // Lưu trữ dạng { concessionId: quantity }
    const [cartTotal, setCartTotal] = useState(0);

    // Quản lý mã giảm giá phía khách hàng
    const [couponCode, setCouponCode] = useState('');
    const [discountAmount, setDiscountAmount] = useState(0);
    const [couponMessage, setCouponMessage] = useState('');

    // 1. Tải danh sách menu đang bán cho khách
    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const data = await concessionApi.getMenu();
                setMenu(data);
            } catch (error) {
                console.error("Lỗi tải menu:", error);
            }
        };
        fetchMenu();
    }, []);

    // 2. Thay đổi số lượng món trong giỏ hàng
    const handleQuantityChange = (id, delta) => {
        setCart(prevCart => {
            const currentQty = prevCart[id] || 0;
            const newQty = currentQty + delta;
            if (newQty <= 0) {
                const updated = { ...prevCart };
                delete updated[id];
                return updated;
            }
            return { ...prevCart, [id]: newQty };
        });
    };

    // 3. Tính tổng tiền giỏ hàng mỗi khi giỏ hàng thay đổi
    useEffect(() => {
        const calculateCartTotal = async () => {
            if (Object.keys(cart).length === 0) {
                setCartTotal(0);
                return;
            }
            try {
                // cart gửi lên backend là Map<Long, Integer> (id món -> số lượng)
                const total = await concessionApi.calculateTotal(cart);
                setCartTotal(total);
            } catch (error) {
                console.error("Lỗi tính tổng tiền:", error);
            }
        };
        calculateCartTotal();
    }, [cart]);

    // 4. Áp dụng mã giảm giá khi thanh toán
    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponMessage('Vui lòng nhập mã giảm giá!');
            return;
        }
        try {
            // Gọi API validate coupon với tổng tiền hiện tại của giỏ hàng
            const discount = await couponApi.validateCoupon(couponCode.toUpperCase(), cartTotal);
            setDiscountAmount(discount);
            setCouponMessage(`Áp dụng mã thành công! Giảm ${Number(discount).toLocaleString()} đ`);
        } catch (error) {
            console.error("Lỗi áp dụng mã:", error);
            setDiscountAmount(0);
            setCouponMessage(error.response?.data || 'Mã giảm giá không hợp lệ hoặc chưa đủ điều kiện đơn hàng tối thiểu.');
        }
    };

    // Tính tổng thanh toán cuối cùng sau khi trừ mã giảm giá
    const finalTotal = Math.max(0, cartTotal - discountAmount);

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
            
            {/* Cột bên trái: Danh sách Menu F&B đang bán */}
            <div style={{ flex: '2', minWidth: '350px' }}>
                <h2>Danh sách Đồ ăn & Thức uống (Menu)</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px', marginTop: '15px' }}>
                    {menu.map((item) => {
                        const qty = cart[item.id] || 0;
                        return (
                            <div key={item.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                {item.imageUrl && (
                                    <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' }} />
                                )}
                                <h4 style={{ margin: '0 0 8px 0' }}>{item.name}</h4>
                                <p style={{ color: '#d9534f', fontWeight: 'bold', margin: '0 0 12px 0' }}>{Number(item.price).toLocaleString()} đ</p>
                                
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <button onClick={() => handleQuantityChange(item.id, -1)} disabled={qty === 0} style={{ padding: '5px 10px', background: '#f0f0f0', border: '1px solid #ccc', cursor: qty === 0 ? 'not-allowed' : 'pointer', borderRadius: '4px' }}>-</button>
                                    <span style={{ fontWeight: 'bold' }}>{qty}</span>
                                    <button onClick={() => handleQuantityChange(item.id, 1)} style={{ padding: '5px 10px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>+</button>
                                </div>
                            </div>
                        );
                    })}
                    {menu.length === 0 && <p style={{ color: '#6c757d' }}>Hiện không có món nào đang bán.</p>}
                </div>
            </div>

            {/* Cột bên phải: Giỏ hàng & Thanh toán */}
            <div style={{ flex: '1', minWidth: '300px', background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #dee2e6', alignSelf: 'flex-start' }}>
                <h3>Giỏ hàng của bạn</h3>
                <div style={{ margin: '15px 0', minHeight: '100px', maxHeight: '200px', overflowY: 'auto' }}>
                    {Object.keys(cart).length === 0 ? (
                        <p style={{ color: '#6c757d', fontStyle: 'italic' }}>Chưa có sản phẩm nào được chọn.</p>
                    ) : (
                        Object.entries(cart).map(([id, qty]) => {
                            const item = menu.find(m => m.id === Number(id));
                            if (!item) return null;
                            return (
                                <div key={id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                                    <span>{item.name} x <b>{qty}</b></span>
                                    <span>{(item.price * qty).toLocaleString()} đ</span>
                                </div>
                            );
                        })
                    )}
                </div>

                <hr style={{ border: '0', borderTop: '1px solid #ccc', margin: '15px 0' }} />

                {/* Phần nhập Mã giảm giá */}
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Mã giảm giá:</label>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <input 
                            type="text" 
                            placeholder="Nhập mã coupon" 
                            value={couponCode} 
                            onChange={(e) => setCouponCode(e.target.value)} 
                            style={{ padding: '8px', flex: '1', borderRadius: '4px', border: '1px solid #ccc', textTransform: 'uppercase' }}
                        />
                        <button onClick={handleApplyCoupon} style={{ background: '#28a745', color: 'white', border: 'none', padding: '8px 12px', cursor: 'pointer', borderRadius: '4px' }}>
                            Áp dụng
                        </button>
                    </div>
                    {couponMessage && <p style={{ fontSize: '12px', marginTop: '5px', color: discountAmount > 0 ? 'green' : 'red' }}>{couponMessage}</p>}
                </div>

                {/* Tổng kết tiền */}
                <div style={{ fontSize: '15px', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Tạm tính:</span>
                    <span>{Number(cartTotal).toLocaleString()} đ</span>
                </div>
                {discountAmount > 0 && (
                    <div style={{ fontSize: '15px', display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'green' }}>
                        <span>Giảm giá:</span>
                        <span>-{Number(discountAmount).toLocaleString()} đ</span>
                    </div>
                )}
                <div style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', marginBottom: '20px', color: '#d9534f' }}>
                    <span>Tổng thanh toán:</span>
                    <span>{Number(finalTotal).toLocaleString()} đ</span>
                </div>

                <button 
                    disabled={Object.keys(cart).length === 0} 
                    onClick={() => alert(`Thành công! Thanh toán tổng số tiền: ${finalTotal.toLocaleString()} đ`)}
                    style={{ width: '100%', background: Object.keys(cart).length === 0 ? '#cccccc' : '#007bff', color: 'white', border: 'none', padding: '12px', cursor: Object.keys(cart).length === 0 ? 'not-allowed' : 'pointer', borderRadius: '4px', fontWeight: 'bold', fontSize: '16px' }}
                >
                    Đặt hàng ngay
                </button>
            </div>

        </div>
    );
};

export default CustomerOrderPage;