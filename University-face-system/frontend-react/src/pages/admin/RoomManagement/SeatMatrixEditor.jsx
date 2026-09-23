import React from 'react';
import { Armchair, CheckCircle2, Ban } from 'lucide-react';

/**
 * SeatMatrixEditor
 * @param {number} rows - Number of seat rows (e.g. 6)
 * @param {number} cols - Number of seat cols (e.g. 8)
 * @param {Array<string>} disabledSeats - Array of disabled seat coordinates e.g. ["0-1", "0-2"]
 * @param {Function} onChange - Callback (newDisabledSeats: string[]) => void
 * @param {boolean} readOnly - If true, seats cannot be toggled
 */
const SeatMatrixEditor = ({ rows = 6, cols = 8, disabledSeats = [], onChange, readOnly = false }) => {
    const totalSeats = rows * cols;
    const activeSeats = totalSeats - (disabledSeats?.length || 0);

    const toggleSeat = (r, c) => {
        if (readOnly || !onChange) return;
        const key = `${r}-${c}`;
        if (disabledSeats.includes(key)) {
            onChange(disabledSeats.filter(s => s !== key));
        } else {
            onChange([...disabledSeats, key]);
        }
    };

    return (
        <div className="space-y-4">
            {/* Legend & Stats */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-gray-700">
                        <span className="w-4 h-4 rounded bg-indigo-100 border border-indigo-300 flex items-center justify-center text-indigo-700 text-[10px] font-bold">1</span>
                        <span>Ghế hoạt động</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500">
                        <span className="w-4 h-4 rounded bg-gray-200 border border-dashed border-gray-400 flex items-center justify-center text-gray-400 text-[10px] font-bold">✕</span>
                        <span>Trống / Hỏng / Lối đi</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-gray-700 font-bold">
                    <span>Quy mô: {rows} hàng × {cols} cột</span>
                    <span className="text-indigo-600 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                        Sức chứa: {activeSeats} / {totalSeats} ghế
                    </span>
                </div>
            </div>

            {/* Blackboard / Podium Indicator */}
            <div className="text-center">
                <div className="inline-block px-10 py-1.5 bg-slate-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm">
                    Bục Giảng / Bảng Viết
                </div>
            </div>

            {/* Grid Container */}
            <div className="p-4 bg-white border border-gray-200 rounded-2xl overflow-x-auto shadow-inner">
                <div className="min-w-fit mx-auto flex flex-col gap-2">
                    {Array.from({ length: rows }).map((_, r) => (
                        <div key={r} className="flex items-center gap-2 justify-center">
                            {/* Row label */}
                            <span className="w-7 text-right text-xs font-bold text-gray-500 font-mono select-none">
                                H{r + 1}
                            </span>

                            {/* Seat Columns */}
                            <div className="flex items-center gap-1.5">
                                {Array.from({ length: cols }).map((_, c) => {
                                    const key = `${r}-${c}`;
                                    const isDisabled = disabledSeats.includes(key);

                                    return (
                                        <button
                                            key={c}
                                            type="button"
                                            disabled={readOnly}
                                            onClick={() => toggleSeat(r, c)}
                                            title={`Hàng ${r + 1}, Cột ${c + 1} ${isDisabled ? '(Ghế trống/hỏng)' : '(Ghế hoạt động)'}`}
                                            className={`w-9 h-9 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center border select-none ${
                                                isDisabled
                                                    ? 'bg-gray-100 text-gray-400 border-dashed border-gray-300 hover:border-gray-400 opacity-60'
                                                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-sm hover:scale-105 active:scale-95'
                                            } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                                        >
                                            {isDisabled ? (
                                                <span className="text-[10px]">✕</span>
                                            ) : (
                                                <span className="text-[11px] font-mono leading-none">{r + 1}-{c + 1}</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Row label right */}
                            <span className="w-7 text-left text-xs font-bold text-gray-400 font-mono select-none">
                                H{r + 1}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {!readOnly && (
                <p className="text-xs text-gray-500 italic text-center">
                    💡 Click vào từng ô ghế để chuyển đổi giữa <strong className="text-indigo-600 font-semibold">Ghế khả dụng</strong> và <strong className="text-gray-600 font-semibold">Ghế trống/hỏng/lối đi</strong>.
                </p>
            )}
        </div>
    );
};

export default SeatMatrixEditor;
