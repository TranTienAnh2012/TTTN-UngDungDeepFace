import React, { useState, useEffect } from 'react';
import { Building, Plus, RefreshCw, Search, X, Users, Grid } from 'lucide-react';
import api from '../../services/api';

const RoomManagement = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);

    const [form, setForm] = useState({
        room_code: '',
        room_name: '',
        building: 'Nhà B',
        capacity: 40,
        seating_rows: 5,
        seating_cols: 8
    });
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const res = await api.get('/structure/rooms');
            if (res.data.success) setRooms(res.data.data);
        } catch (err) {
            console.error('Lỗi khi tải danh sách phòng học:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        setFormError('');
        setIsSubmitting(true);
        try {
            await api.post('/structure/rooms', form);
            setShowModal(false);
            setForm({ room_code: '', room_name: '', building: 'Nhà B', capacity: 40, seating_rows: 5, seating_cols: 8 });
            fetchRooms();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo phòng học');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredRooms = rooms.filter(r => 
        r.room_code.toLowerCase().includes(search.toLowerCase()) || 
        r.room_name.toLowerCase().includes(search.toLowerCase()) ||
        (r.building && r.building.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="p-8 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <Building className="w-7 h-7 text-primary-600" />
                        Quản Lý Phòng Học & Phòng Thi
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Danh mục phòng học, sức chứa và sơ đồ ma trận chỗ ngồi phục vụ điểm danh AI & thi cử
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchRooms}
                        className="p-2.5 text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                        title="Tải lại dữ liệu"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => { setFormError(''); setShowModal(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors shadow-sm text-sm"
                    >
                        <Plus size={18} />
                        Thêm Phòng Mới
                    </button>
                </div>
            </div>

            {/* Filter */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Tìm theo mã phòng, tên phòng, tòa nhà..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                </div>
                <div className="text-sm font-semibold text-gray-500">
                    Tổng số: <span className="text-primary-600 font-bold">{filteredRooms.length}</span> phòng
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50/50 text-gray-700 font-semibold border-b border-gray-100">
                        <tr>
                            <th className="py-3.5 px-6">MÃ PHÒNG</th>
                            <th className="py-3.5 px-6">TÊN PHÒNG HỌC</th>
                            <th className="py-3.5 px-6">TÒA NHÀ</th>
                            <th className="py-3.5 px-6">SỨC CHỨA</th>
                            <th className="py-3.5 px-6">MA TRẬN CHỖ NGỒI (H x C)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredRooms.map((r) => (
                            <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-4 px-6 font-bold text-gray-900">{r.room_code}</td>
                                <td className="py-4 px-6 font-medium text-gray-800">{r.room_name}</td>
                                <td className="py-4 px-6">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                        {r.building || 'Chưa xếp'}
                                    </span>
                                </td>
                                <td className="py-4 px-6 font-semibold text-primary-600">
                                    <span className="flex items-center gap-1.5">
                                        <Users size={16} />
                                        {r.capacity} chỗ
                                    </span>
                                </td>
                                <td className="py-4 px-6 text-gray-600 font-medium">
                                    <span className="flex items-center gap-1.5">
                                        <Grid size={16} className="text-gray-400" />
                                        {r.seating_rows} hàng × {r.seating_cols} cột ({r.seating_rows * r.seating_cols} ghế)
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal: Thêm Phòng */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Thêm Phòng Học Mới</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateRoom} className="p-5 space-y-4">
                            {formError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl">{formError}</div>}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Mã Phòng *</label>
                                    <input
                                        type="text" required placeholder="VD: LAB-B101"
                                        value={form.room_code} onChange={e => setForm({...form, room_code: e.target.value.toUpperCase()})}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tòa Nhà</label>
                                    <input
                                        type="text" placeholder="VD: Nhà B"
                                        value={form.building} onChange={e => setForm({...form, building: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Tên Phòng Chi Tiết *</label>
                                <input
                                    type="text" required placeholder="VD: Phòng Máy Lab B-101"
                                    value={form.room_name} onChange={e => setForm({...form, room_name: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Sức Chứa</label>
                                    <input
                                        type="number" value={form.capacity} onChange={e => setForm({...form, capacity: Number(e.target.value)})}
                                        className="w-full px-2.5 py-2 border border-gray-200 rounded-xl text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Số Hàng Ghế</label>
                                    <input
                                        type="number" value={form.seating_rows} onChange={e => setForm({...form, seating_rows: Number(e.target.value)})}
                                        className="w-full px-2.5 py-2 border border-gray-200 rounded-xl text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Số Cột Ghế</label>
                                    <input
                                        type="number" value={form.seating_cols} onChange={e => setForm({...form, seating_cols: Number(e.target.value)})}
                                        className="w-full px-2.5 py-2 border border-gray-200 rounded-xl text-sm"
                                    />
                                </div>
                            </div>
                            <div className="pt-2 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 text-sm">Hủy</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium">Lưu Phòng</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomManagement;
