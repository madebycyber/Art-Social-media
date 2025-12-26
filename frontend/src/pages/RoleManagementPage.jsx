import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { Shield, Plus, Save, CheckCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RoleManagementPage = () => {
    const navigate = useNavigate();
    const [user] = useState(() => JSON.parse(localStorage.getItem('user')));

    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    
    // State cho việc tạo Role
    const [newRoleName, setNewRoleName] = useState('');
    
    // State cho việc chỉnh sửa quyền
    const [selectedRole, setSelectedRole] = useState(null);
    const [selectedPermIds, setSelectedPermIds] = useState(new Set());

    // 1. Check quyền Admin ngay khi vào trang
    useEffect(() => {
        if (!user || user.role !== 'ADMIN') {
            alert("Bạn không có quyền truy cập trang này!");
            navigate('/');
        }
    }, [user, navigate]);

    // 2. Load dữ liệu ban đầu
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [rolesData, permsData] = await Promise.all([
                axiosClient.get('/admin/roles'),
                axiosClient.get('/admin/roles/permissions')
            ]);
            setRoles(rolesData || []);
            setPermissions(permsData || []);
        } catch (error) {
            console.error("Lỗi tải dữ liệu admin:", error);
        }
    };

    // 3. Xử lý khi chọn một Role để sửa
    const handleSelectRole = (role) => {
        setSelectedRole(role);
        // Lấy danh sách ID quyền hiện có của Role đó
        const currentPermIds = new Set(role.permissions.map(p => p.id));
        setSelectedPermIds(currentPermIds);
    };

    // 4. Tạo Role mới
    const handleCreateRole = async (e) => {
        e.preventDefault();
        if (!newRoleName) return;
        try {
            await axiosClient.post('/admin/roles', { name: newRoleName.toUpperCase(), description: 'Custom Role' });
            setNewRoleName('');
            loadData(); // Reload lại list
            alert("Tạo Role thành công");
        } catch (error) {
            alert("Lỗi: " + (error.response?.data?.message || "Không thể tạo Role"));
        }
    };

    // 5. Toggle checkbox quyền
    const handleTogglePermission = (permId) => {
        if (selectedRole?.name === 'ADMIN') return; // Không cho sửa quyền Admin

        setSelectedPermIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(permId)) newSet.delete(permId);
            else newSet.add(permId);
            return newSet;
        });
    };

    // 6. Lưu quyền cho Role
    const handleSavePermissions = async () => {
        if (!selectedRole) return;
        try {
            // Backend nhận List<Long> permissionIds
            const payload = Array.from(selectedPermIds);
            await axiosClient.post(`/admin/roles/${selectedRole.id}/permissions`, payload);
            alert("Đã cập nhật quyền thành công!");
            loadData(); // Reload để đồng bộ
        } catch (error) {
            alert("Lỗi lưu quyền");
        }
    };

    if (!user || user.role !== 'ADMIN') return null;

    return (
        <div className="social-layout">
            <main className="no-scrollbar" style={{ overflowY: 'auto', height: 'calc(100vh - 48px)', padding: '20px' }}>
                
                <h2 style={{ fontSize: '28px', color: 'white', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Shield size={32} color="#8b5cf6" /> Quản lý Phân quyền
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                    
                    {/* CỘT TRÁI: DANH SÁCH ROLE */}
                    <div className="glass-panel" style={{ padding: '20px' }}>
                        <h3 style={{ marginTop: 0, color: '#a78bfa' }}>Danh sách Vai trò</h3>
                        
                        {/* Form tạo mới */}
                        <form onSubmit={handleCreateRole} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                            <input 
                                className="glass-input" 
                                placeholder="Tên Role mới (VD: EDITOR)..." 
                                value={newRoleName}
                                onChange={e => setNewRoleName(e.target.value)}
                            />
                            <button type="submit" className="btn-primary" style={{ padding: '10px' }}><Plus /></button>
                        </form>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {roles.map(role => (
                                <div 
                                    key={role.id}
                                    onClick={() => handleSelectRole(role)}
                                    style={{
                                        padding: '12px', borderRadius: '12px', cursor: 'pointer',
                                        background: selectedRole?.id === role.id ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255,255,255,0.05)',
                                        border: selectedRole?.id === role.id ? '1px solid #8b5cf6' : '1px solid transparent',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}
                                >
                                    <span style={{ fontWeight: 'bold' }}>{role.name}</span>
                                    <span style={{ fontSize: '12px', color: '#aaa' }}>{role.permissions.length} quyền</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CỘT PHẢI: CHECKLIST QUYỀN */}
                    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: '#f472b6' }}>
                                {selectedRole ? `Phân quyền cho: ${selectedRole.name}` : 'Chọn một Role để chỉnh sửa'}
                            </h3>
                            {selectedRole && selectedRole.name !== 'ADMIN' && (
                                <button onClick={handleSavePermissions} className="btn-primary" style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                    <Save size={18} /> Lưu thay đổi
                                </button>
                            )}
                        </div>

                        {selectedRole ? (
                            <>
                                {selectedRole.name === 'ADMIN' && (
                                    <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '8px', marginBottom: '15px', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <AlertTriangle size={20} />
                                        <span>Role ADMIN có toàn quyền và không thể chỉnh sửa.</span>
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' }}>
                                    {permissions.map(perm => {
                                        const isChecked = selectedPermIds.has(perm.id);
                                        return (
                                            <div 
                                                key={perm.id}
                                                onClick={() => handleTogglePermission(perm.id)}
                                                style={{
                                                    padding: '12px', borderRadius: '8px', cursor: selectedRole.name === 'ADMIN' ? 'not-allowed' : 'pointer',
                                                    background: isChecked ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                                                    border: isChecked ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                                                    display: 'flex', alignItems: 'center', gap: '10px', opacity: selectedRole.name === 'ADMIN' ? 0.7 : 1
                                                }}
                                            >
                                                <div style={{ 
                                                    width: '20px', height: '20px', borderRadius: '50%', border: '2px solid white', 
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: isChecked ? '#10b981' : 'transparent', borderColor: isChecked ? '#10b981' : '#666'
                                                }}>
                                                    {isChecked && <CheckCircle size={14} color="white" />}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '600', fontSize: '13px' }}>{perm.name}</div>
                                                    <div style={{ fontSize: '11px', color: '#aaa' }}>{perm.description}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}>
                                Vui lòng chọn Role bên trái
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default RoleManagementPage;