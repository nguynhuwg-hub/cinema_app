import React, { useState, useEffect } from 'react';
import { concessionApi } from '../api/concessionApi';

const ConcessionManagement = () => {
    const [concessions, setConcessions] = useState([]);
    const [formData, setFormData] = useState({ id: '', name: '', price: '', active: true, imageUrl: '' });
    const [isEditing, setIsEditing] = useState(false);

    const fetchConcessions = async () => {
        try {
            const data = await concessionApi.getManageList();
            setConcessions(data);
        } catch (error) {
            console.error("Lỗi khi tải danh sách F&B:", error);
        }
    };

    useEffect(() => {
        fetchConcessions();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Lọc chỉ lấy các chữ số cho giá tiền
            const cleanPrice = String(formData.price).replace(/\D/g, '');

            // Đóng gói payload khớp hoàn toàn với Entity Java (price dạng số, isActive thay vì active)
            const payload = {
                id: formData.id || null,
                name: formData.name,
                description: formData.description || "",
                price: cleanPrice === '' ? 0 : Number(cleanPrice),
                imageUrl: formData.imageUrl || "",
                isActive: formData.active ?? true
            };

            await concessionApi.saveConcession(payload);
            alert('Lưu sản phẩm thành công!');
            setFormData({ id: '', name: '', price: '', active: true, imageUrl: '' });
            setIsEditing(false);
            fetchConcessions();
        } catch (error) {
            console.error("Lỗi khi lưu sản phẩm:", error);
            alert('Lưu thất bại, vui lòng kiểm tra lại!');
        }
    };

    const handleEdit = (item) => {
        setFormData({
            id: item.id,
            name: item.name || '',
            price: item.price !== undefined ? item.price : '',
            imageUrl: item.imageUrl || '',
            // Đồng bộ trạng thái active từ isActive của Backend
            active: item.isActive !== undefined ? item.isActive : (item.active !== undefined ? item.active : true)
        });
        setIsEditing(true);
    };

    return (
        <div style={{ padding: '30px', color: '#ffffff' }}>
            <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>F&B MANAGEMENT</p>
                <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>Quản lý Đồ ăn & Thức uống (F&B)</h2>
            </div>

            <form onSubmit={handleSubmit} style={{ background: '#161b22', padding: '24px', borderRadius: '12px', marginBottom: '30px', display: 'flex', gap: '16px', flexWrap: 'wrap', border: '1px solid #30363d' }}>
                <input 
                    type="text" 
                    placeholder="Tên món (Ví dụ: Bắp rang bơ lớn)" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    required 
                    style={{ padding: '10px 12px', flex: '1 1 220px', borderRadius: '6px', border: '1px solid #30363d', background: '#0d1117', color: '#fff', outline: 'none' }}
                />
                
                {/* Ô nhập giá tiền dạng text */}
                <input 
                    type="text" 
                    placeholder="Giá tiền (Ví dụ: 45000)" 
                    value={formData.price} 
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })} 
                    required 
                    style={{ padding: '10px 12px', flex: '1 1 150px', borderRadius: '6px', border: '1px solid #30363d', background: '#0d1117', color: '#fff', outline: 'none' }}
                />

                <input 
                    type="text" 
                    placeholder="Đường dẫn ảnh (URL hình ảnh)" 
                    value={formData.imageUrl} 
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} 
                    style={{ padding: '10px 12px', flex: '1 1 220px', borderRadius: '6px', border: '1px solid #30363d', background: '#0d1117', color: '#fff', outline: 'none' }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', cursor: 'pointer', color: '#ddd' }}>
                    <input 
                        type="checkbox" 
                        checked={formData.active} 
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })} 
                        style={{ width: '18px', height: '18px', accentColor: '#ff4d4f', cursor: 'pointer' }}
                    />
                    Đang bán
                </label>
                <div style={{ width: '100%', display: 'flex', gap: '10px', marginTop: '5px' }}>
                    <button type="submit" style={{ background: '#ff4d4f', color: 'white', border: 'none', padding: '10px 20px', cursor: 'pointer', borderRadius: '6px', fontWeight: 'bold' }}>
                        {isEditing ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}
                    </button>
                    {isEditing && (
                        <button type="button" onClick={() => { setIsEditing(false); setFormData({ id: '', name: '', price: '', active: true, imageUrl: '' }); }} style={{ background: '#30363d', color: 'white', border: 'none', padding: '10px 20px', cursor: 'pointer', borderRadius: '6px' }}>
                            Hủy bỏ
                        </button>
                    )}
                </div>
            </form>

            <div style={{ background: '#161b22', borderRadius: '12px', border: '1px solid #30363d', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#21262d', color: '#8b949e', borderBottom: '1px solid #30363d', fontSize: '13px' }}>
                            <th style={{ padding: '14px 16px' }}>ID</th>
                            <th style={{ padding: '14px 16px' }}>Tên món</th>
                            <th style={{ padding: '14px 16px' }}>Giá (VNĐ)</th>
                            <th style={{ padding: '14px 16px' }}>Trạng thái</th>
                            <th style={{ padding: '14px 16px', textAlign: 'center' }}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {concessions.map((item) => {
                            // Hỗ trợ hiển thị trạng thái dù backend trả về isActive hay active
                            const statusActive = item.isActive ?? item.active ?? true;
                            return (
                                <tr key={item.id} style={{ borderBottom: '1px solid #30363d', fontSize: '14px' }}>
                                    <td style={{ padding: '14px 16px', color: '#8b949e' }}>{item.id}</td>
                                    <td style={{ padding: '14px 16px', fontWeight: '500', color: '#fff' }}>{item.name}</td>
                                    <td style={{ padding: '14px 16px', color: '#ff4d4f', fontWeight: 'bold' }}>{isNaN(item.price) ? item.price : Number(item.price).toLocaleString()} đ</td>
                                    <td style={{ padding: '14px 16px' }}>
                                        {statusActive ? 
                                            <span style={{ color: '#2ea043', fontWeight: 'bold' }}>● Đang bán</span> : 
                                            <span style={{ color: '#f85149', fontWeight: 'bold' }}>● Ngừng bán</span>
                                        }
                                    </td>
                                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                        <button onClick={() => handleEdit(item)} style={{ background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', padding: '6px 14px', cursor: 'pointer', borderRadius: '6px', fontWeight: '500' }}>Sửa</button>
                                    </td>
                                </tr>
                            );
                        })}
                        {concessions.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#8b949e' }}>Chưa có sản phẩm F&B nào trong hệ thống.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ConcessionManagement;