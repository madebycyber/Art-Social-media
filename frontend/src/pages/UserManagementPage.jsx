import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { Users, Plus, Edit, Trash, X, Save, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserManagementPage = () => {
    const navigate = useNavigate();
    const [currentUser] = useState(() => JSON.parse(localStorage.getItem('user')));

    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    
    // State Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null); // null = mode tạo mới

    // Form Data
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        roleId: ''
    });

    useEffect(() => {
        if (!currentUser || currentUser.role !== 'ADMIN') {
            alert("Bạn không có quyền!");
            navigate('/');
            return;
        }
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [usersRes, rolesRes] = await Promise.all([
                axiosClient.get('/admin/users'),
                axiosClient.get('/admin/roles')
            ]);
            setUsers(usersRes || []);
            setRoles(rolesRes || []);
        } catch (error) {
            console.error(error);
        }
    };

    // Mở Modal (Thêm hoặc Sửa)
    const handleOpenModal = (user = null) => {
        setEditingUser(user);
        if (user) {
            // Mode Edit
            setFormData({
                username: user.username,
                password: '', // Không hiện pass cũ
                roleId: user.role.id
            });
        } else {
            // Mode Create
            setFormData({
                username: '',
                password: '',
                roleId: roles.length > 0 ? roles[0].id : ''
            });
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn chắc chắn muốn xóa user này?")) return;
        try {
            await axiosClient.delete(`/admin/users/${id}`);
            alert("Đã xóa!");
            loadData();
        } catch (error) {
            alert(error.response?.data || "Lỗi xóa user");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                // Update
                await axiosClient.put(`/admin/users/${editingUser.id}`, formData);
                alert("Cập nhật thành công!");
            } else {
                // Create
                await axiosClient.post('/admin/users', formData);
                alert("Tạo user thành công!");
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            alert(error.response?.data || "Có lỗi xảy ra");
        }
    };

    return (
        <div className="social-layout">
            <main className="no-scrollbar" style={{ overflowY: 'auto', height: 'calc(100vh - 48px)', padding: '20px' }}>
                
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
                    <h2 style={{ fontSize: '28px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                        <Users size={32} color="#8b5cf6" /> Quản lý Người dùng
                    </h2>
                    <button onClick={() => handleOpenModal(null)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Plus size={20} /> Thêm User
                    </button>
                </div>

                {/* BẢNG USER */}
                <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                <th style={{ padding: '15px' }}>ID</th>
                                <th style={{ padding: '15px' }}>Username</th>
                                <th style={{ padding: '15px' }}>Vai trò</th>
                                <th style={{ padding: '15px' }}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '15px' }}>#{u.id}</td>
                                    <td style={{ padding: '15px', fontWeight: 'bold' }}>{u.username}</td>
                                    <td style={{ padding: '15px' }}>
                                        <span style={{ 
                                            padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
                                            // SỬA Ở ĐÂY: u.roleName thay vì u.role.name
                                            background: u.roleName === 'ADMIN' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                            color: u.roleName === 'ADMIN' ? '#fca5a5' : '#93c5fd'
                                        }}>
                                            {u.roleName} {/* SỬA Ở ĐÂY */}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px', display: 'flex', gap: '10px' }}>
                                        {/* Sửa lại hàm handleOpenModal để map đúng dữ liệu vào form sửa */}
                                        <button onClick={() => {
                                            setEditingUser(u);
                                            setFormData({
                                                username: u.username,
                                                password: '',
                                                roleId: u.roleId // SỬA Ở ĐÂY: Dùng u.roleId trực tiếp
                                            });
                                            setIsModalOpen(true);
                                        }} style={{ background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer' }} title="Sửa">
                                            <Edit size={18} />
                                        </button>
                                        
                                        <button onClick={() => handleDelete(u.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Xóa">
                                            <Trash size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* MODAL ADD/EDIT */}
                {isModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div className="glass-panel" style={{ width: '400px', padding: '30px', background: '#18181b' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, color: 'white' }}>{editingUser ? 'Cập nhật User' : 'Tạo User mới'}</h3>
                                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24}/></button>
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '5px' }}>Username</label>
                                    <input 
                                        className="glass-input" 
                                        value={formData.username}
                                        onChange={e => setFormData({...formData, username: e.target.value})}
                                        disabled={!!editingUser} // Không cho sửa username
                                        required
                                    />
                                </div>

                                <div>
                                    <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '5px' }}>
                                        {editingUser ? 'Mật khẩu mới (Để trống nếu không đổi)' : 'Mật khẩu'}
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input 
                                            type="password"
                                            className="glass-input" 
                                            value={formData.password}
                                            onChange={e => setFormData({...formData, password: e.target.value})}
                                            required={!editingUser} // Bắt buộc nếu tạo mới
                                        />
                                        <Lock size={16} style={{ position: 'absolute', right: '10px', top: '12px', color: '#666' }} />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '5px' }}>Vai trò (Role)</label>
                                    <select 
                                        className="glass-select" 
                                        style={{ width: '100%' }}
                                        value={formData.roleId}
                                        onChange={e => setFormData({...formData, roleId: e.target.value})}
                                    >
                                        {roles.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <button type="submit" className="btn-primary" style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                    <Save size={18} /> Lưu lại
                                </button>
                            </form>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};

export default UserManagementPage;