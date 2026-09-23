import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, Building2, LayoutGrid, Eye, Armchair, ShieldCheck } from 'lucide-react';
import api from '../../../services/api';
import CreateRoom from './CreateRoom';
import EditRoom from './EditRoom';
import DeleteRoom from './DeleteRoom';
import SeatMatrixEditor from './SeatMatrixEditor';

const RoomManagement = () => {
    const [rooms, setRooms] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 12, totalPages: 1, total: 0 });
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);

    // Modal preview seat layout
    const [previewRoom, setPreviewRoom] = useState(null);

    const fetchRooms = useCallback(async (page = pagination.page, searchTerm = search) => {
        setLoading(true);
        try {
            const res = await api.get(`/rooms?page=${page}&limit=${pagination.limit}&search=${searchTerm}&status=${statusFilter}`);
            if (res.data.success) {
                setRooms(res.data.data || []);
                setPagination(res.data.pagination || { page: 1, limit: 12, totalPages: 1, total: 0 });
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách phòng:', error);
        }
        setLoading(false);
    }, [pagination.limit, statusFilter]);

    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchRooms(1, search);
    };

    const getRoomTypeBadge = (type) => {
        switch (type) {
            case 'exam_hall':
                return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">Phòng Thi</span>;
            case 'lab':
                return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Phòng Lab/Máy tính</span>;
            default:
                return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">Lý Thuyết</span>;
        }
    };

    const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
                        <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl shadow-sm">
                            <Building2 size={24} />
                        </div>
                        Quản Lý Phòng & Sơ Đồ Ghế
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm font-medium">
                        Định nghĩa danh mục phòng và sơ đồ chỗ ngồi chuẩn để tái sử dụng khi xếp lịch thi và lịch học
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-primary-200 flex items-center gap-2 self-start sm:self-auto"
                >
                    <Plus size={18} />
                    <span>Tạo Phòng Mới</span>
                </button>
            </div>

            {/* Filter / Search Bar & View Mode Toggle */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <form onSubmit={handleSearch} className="relative w-full sm:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Tìm theo mã phòng, tên, tòa nhà..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white shadow-sm"
                    />
                </form>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 font-medium bg-white focus:ring-2 focus:ring-primary-500 shadow-sm"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="Active">Đang hoạt động</option>
                        <option value="Maintenance">Đang bảo trì</option>
                    </select>

                    <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                viewMode === 'table' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <span>Danh sách dạng bảng</span>
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                viewMode === 'grid' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <LayoutGrid size={14} />
                            <span>Dạng lưới thẻ</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Room Display: Table or Grid */}
            {loading ? (
                <div className="py-20 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
                    <div className="w-9 h-9 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                    <span className="font-semibold text-sm">Đang tải danh sách phòng...</span>
                </div>
            ) : rooms.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-500 font-medium shadow-sm">
                    <Armchair size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-base font-bold text-gray-700">Chưa có phòng học nào được tạo</p>
                    <p className="text-xs text-gray-400 mt-1">Bấm nút "Tạo Phòng Mới" để bắt đầu thiết lập sơ đồ ghế.</p>
                </div>
            ) : viewMode === 'table' ? (
                /* Table View */
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-700 font-extrabold text-xs uppercase tracking-wider">
                                    <th className="py-3.5 px-5">MÃ PHÒNG</th>
                                    <th className="py-3.5 px-5">TÊN PHÒNG HỌC</th>
                                    <th className="py-3.5 px-5">TÒA NHÀ</th>
                                    <th className="py-3.5 px-5 text-center">SỨC CHỨA</th>
                                    <th className="py-3.5 px-5 text-center">MA TRẬN CHỖ NGỒI (H x C)</th>
                                    <th className="py-3.5 px-5 text-right">THAO TÁC</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                                {rooms.map((room) => {
                                    const totalSeats = room.seating_rows * room.seating_cols;
                                    const disabledCount = room.disabled_seats?.length || 0;
                                    const usableSeats = totalSeats - disabledCount;

                                    return (
                                        <tr key={room.id} className="hover:bg-indigo-50/20 transition-colors">
                                            <td className="py-4 px-5 font-bold font-mono text-indigo-700">{room.room_code}</td>
                                            <td className="py-4 px-5 font-bold text-gray-900">{room.room_name}</td>
                                            <td className="py-4 px-5">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
                                                    {room.building || 'Tòa nhà'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-5 text-center font-bold text-indigo-600">
                                                <span className="inline-flex items-center gap-1">
                                                    <Users size={15} />
                                                    {usableSeats} chỗ
                                                </span>
                                            </td>
                                            <td className="py-4 px-5 text-center">
                                                <button
                                                    onClick={() => setPreviewRoom(room)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 text-xs font-bold font-mono transition-all hover:scale-105"
                                                    title="Bấm để xem sơ đồ chỗ ngồi"
                                                >
                                                    <Armchair size={14} className="text-indigo-600" />
                                                    <span>{room.seating_rows} hàng × {room.seating_cols} cột</span>
                                                </button>
                                            </td>
                                            <td className="py-4 px-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setPreviewRoom(room)}
                                                        className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1"
                                                        title="Xem sơ đồ ghế"
                                                    >
                                                        <Eye size={14} /> Xem Sơ Đồ
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedRoom(room); setIsEditOpen(true); }}
                                                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1"
                                                        title="Sửa sơ đồ ghế & thông tin phòng"
                                                    >
                                                        <Edit2 size={14} /> Sửa Sơ Đồ
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedRoom(room); setIsDeleteOpen(true); }}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Xóa phòng"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* Card Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {rooms.map((room) => {
                        const totalSeats = room.seating_rows * room.seating_cols;
                        const disabledCount = room.disabled_seats?.length || 0;
                        const usableSeats = totalSeats - disabledCount;

                        return (
                            <div
                                key={room.id}
                                className="bg-white border border-gray-200 hover:border-indigo-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div>
                                            <span className="font-mono text-base font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                                                {room.room_code}
                                            </span>
                                            <h3 className="font-bold text-gray-900 mt-2 text-base line-clamp-1">
                                                {room.room_name}
                                            </h3>
                                        </div>
                                        {getRoomTypeBadge(room.room_type)}
                                    </div>

                                    {room.building && (
                                        <div className="text-xs text-gray-500 font-medium mb-3 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                            {room.building}
                                        </div>
                                    )}

                                    {/* Matrix dimensions summary */}
                                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5 text-xs text-gray-600 mb-4 font-medium">
                                        <div className="flex items-center justify-between">
                                            <span>Quy mô lưới:</span>
                                            <span className="font-bold text-gray-900 font-mono">{room.seating_rows} hàng × {room.seating_cols} cột</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>Sức chứa sử dụng:</span>
                                            <span className="font-bold text-indigo-700">{usableSeats} chỗ</span>
                                        </div>
                                        {disabledCount > 0 && (
                                            <div className="flex items-center justify-between text-gray-500">
                                                <span>Ghế trống / hỏng:</span>
                                                <span className="font-semibold text-red-500">{disabledCount} ghế</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                    <button
                                        onClick={() => setPreviewRoom(room)}
                                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                    >
                                        <Eye size={14} /> Xem Sơ Đồ
                                    </button>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => { setSelectedRoom(room); setIsEditOpen(true); }}
                                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg transition-all flex items-center gap-1"
                                            title="Sửa phòng & sơ đồ chỗ ngồi"
                                        >
                                            <Edit2 size={14} /> Sửa Sơ Đồ
                                        </button>
                                        <button
                                            onClick={() => { setSelectedRoom(room); setIsDeleteOpen(true); }}
                                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Xóa phòng"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {rooms.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                    <span className="text-xs font-bold text-gray-600">
                        Tổng cộng {pagination.total} phòng (Trang {pagination.page} / {pagination.totalPages})
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={pagination.page <= 1}
                            onClick={() => fetchRooms(pagination.page - 1)}
                            className="px-3 py-1.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                        >
                            Trước
                        </button>
                        <button
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() => fetchRooms(pagination.page + 1)}
                            className="px-3 py-1.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                        >
                            Sau
                        </button>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewRoom && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden p-6 border border-gray-100 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    Sơ Đồ Ghế Phòng {previewRoom.room_code}
                                </h3>
                                <p className="text-xs text-gray-500">{previewRoom.room_name}</p>
                            </div>
                            <button
                                onClick={() => setPreviewRoom(null)}
                                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-xl"
                            >
                                Đóng
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <SeatMatrixEditor
                                rows={previewRoom.seating_rows}
                                cols={previewRoom.seating_cols}
                                disabledSeats={previewRoom.disabled_seats}
                                readOnly={true}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            <CreateRoom
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onCreated={() => fetchRooms(1)}
            />
            <EditRoom
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                onUpdated={() => fetchRooms()}
                room={selectedRoom}
            />
            <DeleteRoom
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onDeleted={() => fetchRooms(1)}
                room={selectedRoom}
            />
        </div>
    );
};

export default RoomManagement;
