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
            await concessionApi.saveConcession(formData);
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
        setFormData(item);
        setIsEditing(true);
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
            <h2>Quản lý Đồ ăn & Thức uống (F&B)</h2>

            <form onSubmit={handleSubmit} style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '25px', display: 'flex', gap: '12px', flexWrap: 'wrap', border: '1px solid #dee2e6' }}>
                <input 
                    type="text" 
                    placeholder="Tên món (Ví dụ: Bắp rang bơ lớn)" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    required 
                    style={{ padding: '10px', flex: '1 1 220px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <input 
                    type="number" 
                    placeholder="Giá tiền (VNĐ)" 
                    value={formData.price} 
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })} 
                    required 
                    style={{ padding: '10px', flex: '1 1 150px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <input 
                    type="text" 
                    placeholder="Đường dẫn ảnh (URL hình ảnh)" 
                    value={formData.imageUrl} 
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} 
                    style={{ padding: '10px', flex: '1 1 220px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                    <input 
                        type="checkbox" 
                        checked={formData.active} 
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })} 
                        style={{ width: '18px', height: '18px' }}
                    />
                    Đang bán
                </label>
                <div style={{ width: '100%', display: 'flex', gap: '10px' }}>
                    <button type="submit" style={{ background: '#007bff', color: 'white', border: 'none', padding: '10px 20px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>
                        {isEditing ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}
                    </button>
                    {isEditing && (
                        <button type="button" onClick={() => { setIsEditing(false); setFormData({ id: '', name: '', price: '', active: true, imageUrl: '' }); }} style={{ background: '#6c757d', color: 'white', border: 'none', padding: '10px 20px', cursor: 'pointer', borderRadius: '4px' }}>
                            Hủy bỏ
                        </button>
                    )}
                </div>
            </form>

            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <thead>
                    <tr style={{ background: '#343a40', color: 'white', textAlign: 'left' }}>
                        <th style={{ padding: '12px' }}>ID</th>
                        <th style={{ padding: '12px' }}>Tên món</th>
                        <th style={{ padding: '12px' }}>Giá (VNĐ)</th>
                        <th style={{ padding: '12px' }}>Trạng thái</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {concessions.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                            <td style={{ padding: '12px' }}>{item.id}</td>
                            <td style={{ padding: '12px', fontWeight: '500' }}>{item.name}</td>
                            <td style={{ padding: '12px' }}>{Number(item.price).toLocaleString()} đ</td>
                            <td style={{ padding: '12px' }}>
                                {item.active ? 
                                    <span style={{ color: 'green', fontWeight: 'bold' }}>● Đang bán</span> : 
                                    <span style={{ color: 'red', fontWeight: 'bold' }}>● Ngừng bán</span>
                                }
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                <button onClick={() => handleEdit(item)} style={{ background: '#ffc107', border: 'none', padding: '6px 14px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>Sửa</button>
                            </td>
                        </tr>
                    ))}
                    {concessions.length === 0 && (
                        <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>Chưa có sản phẩm F&B nào trong hệ thống.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ConcessionManagement;