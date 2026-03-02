import React, { useState } from 'react';
import { FiZoomIn, FiZoomOut, FiMaximize2, FiChevronDown } from 'react-icons/fi';
import theme from '../../theme';

const ZoomControls = ({ zoom, setZoom }) => {
    const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 1.5));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
    const handleResetZoom = () => setZoom(1);

    const zoomLevels = [0.5, 0.75, 1, 1.25, 1.5];

    return (
        <div className="absolute bottom-8 right-8 flex items-center bg-white border border-ne   utral-200 rounded shadow-xl p-1 z-[100]">
            <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-neutral-50 rounded text-neutral-500 transition-colors"
                title="Zoom Out"
            >
                <FiZoomOut size={16} />
            </button>

            <div className="relative border-l border-r border-neutral-100 flex items-center">
                <button
                    onClick={() => setIsZoomModalOpen(!isZoomModalOpen)}
                    className="flex items-center justify-center min-w-[60px] h-8 hover:bg-neutral-50 rounded transition-colors"
                >
                    <span className="text-[10px] font-bold text-neutral-600">{Math.round(zoom * 100)}%</span>
                    <FiChevronDown size={10} className="ml-1 text-neutral-400" />
                </button>

                {/* Zoom Option Modal/Dropdown */}
                {isZoomModalOpen && (
                    <div className="absolute bottom-full right-0 mb-2 w-24 bg-white border border-neutral-200 shadow-2xl rounded-md overflow-hidden py-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        {zoomLevels.map(lvl => (
                            <button
                                key={lvl}
                                onClick={() => { setZoom(lvl); setIsZoomModalOpen(false); }}
                                className={`w-full text-left px-4 py-2 text-[10px] font-bold transition-colors ${zoom === lvl ? 'bg-opacity-5' : 'text-neutral-500 hover:bg-neutral-50'}`}
                                style={zoom === lvl ? { color: theme.colors.primary, backgroundColor: `${theme.colors.primary}0D` } : {}}
                            >
                                {Math.round(lvl * 100)}%
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-neutral-50 rounded text-neutral-500 transition-colors"
                title="Zoom In"
            >
                <FiZoomIn size={16} />
            </button>
            <div className="w-[1px] h-4 bg-neutral-200 mx-1"></div>
            <button
                onClick={handleResetZoom}
                className="p-2 hover:bg-neutral-50 rounded text-neutral-400 transition-colors"
                title="Fit to Screen"
            >
                <FiMaximize2 size={16} />
            </button>
        </div>
    );
};

export default ZoomControls;
