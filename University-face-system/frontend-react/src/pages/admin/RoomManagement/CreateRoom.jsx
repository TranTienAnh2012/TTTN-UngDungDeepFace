import React, { useState } from 'react';
import { X, Building2, Plus, LayoutGrid, Users } from 'lucide-react';
import api from '../../../services/api';
import SeatMatrixEditor from './SeatMatrixEditor';

const CreateRoom = ({ isOpen, onClose, onCreated }) => {
    const [formData, setFormData] = useState({
        room_code: '',
        room_name: '',
        building: 'Tòa B',
        room_type: 'exam_hall',
        seating_rows: 6,
        seating_cols: 8,
        disabled_seats: [],
        status: 'Active'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.room_code.trim() || !formData.room_name.trim()) {
            setError('Vui lòng nhập Mã phòng và Tên phòng');
            return;
        }

        setIsSubmitting(true);
        setError('');

        const actualCapacity = formData.seating_rows * formData.seating_cols - formData.disabled_seats.length;

        try {
            const res = await api.post('/rooms', {
                ...formData,
                capacity: actualCapacity
            });
            if (res.data.success) {
                onCreated();
                onClose();
                // Reset form
                setFormData({
                    room_code: '',
                    room_name: '',
                    building: 'Tòa B',
                    room_type: 'exam_hall',
                    seating_rows: 6,
                    seating_cols: 8,
                    disabled_seats: [],
                    status: 'Active'
                });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo phòng');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Building2 className="text-primary-600" size={22} />
                            Tạo Phòng Học / Phòng Thi Mới
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">Thiết lập thông tin và cấu hình ma trận sơ đồ ghế tái sử dụng</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                    {error && (
                        <div className="p-3.5 bg-red-50 text-red-600 text-sm rounded-xl font-medium border border-red-200">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Mã Phòng *
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="VD: B401, P302, LAB01..."
                                value={formData.room_code}
                                onChange={(e) => setFormData({ ...formData, room_code: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Tên Phòng *
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="VD: Phòng thi 401 - Tòa B"
                                value={formData.room_name}
                                onChange={(e) => setFormData({ ...formData, room_name: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Tòa Nhà / Khu Vực
                            </label>
                            <input
                                type="text"
                                placeholder="VD: Tòa A, Tòa B, Khu C..."
                                value={formData.building}
                                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Loại Phòng
                            </label>
                            <select
                                value={formData.room_type}
                                onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                            >
                                <option value="exam_hall">Phòng thi chuyên dụng</option>
                                <option value="theory">Phòng học lý thuyết</option>
                                <option value="lab">Phòng thực hành / Lab</option>
                            </select>
                        </div>
                    </div>

                    {/* Seating Layout Dimensions */}
                    <div className="pt-2 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <LayoutGrid size={18} className="text-indigo-600" />
                                Cấu Hình Sơ Đồ Chỗ Ngồi (Matrix Layout)
                            </h4>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Số hàng (Rows)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={formData.seating_rows}
                                    onChange={(e) => setFormData({ ...formData, seating_rows: Math.max(1, parseInt(e.target.value) || 1) })}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm font-bold focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Số cột (Cols)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={formData.seating_cols}
                                    onChange={(e) => setFormData({ ...formData, seating_cols: Math.max(1, parseInt(e.target.value) || 1) })}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm font-bold focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div className="col-span-2 sm:col-span-1 flex flex-col justify-end">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, disabled_seats: [] })}
                                    className="px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                                >
                                    Khôi phục toàn bộ ghế
                                </button>
                            </div>
                        </div>

                        {/* Interactive Seat Grid */}
                        <SeatMatrixEditor
                            rows={formData.seating_rows}
                            cols={formData.seating_cols}
                            disabledSeats={formData.disabled_seats}
                            onChange={(newDisabled) => setFormData({ ...formData, disabled_seats: newDisabled })}
                        />
                    </div>

                    {/* Footer buttons */}
                    <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold shadow-md shadow-primary-200 transition-all flex items-center gap-1.5 disabled:opacity-70"
                        >
                            <Plus size={18} />
                            {isSubmitting ? 'Đang tạo...' : 'Lưu Phòng & Sơ Đồ'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateRoom;
