import React, { useState } from 'react';
import { FiCamera, FiLayout, FiPackage } from 'react-icons/fi';
import theme from '../../../theme';
import MediaLibraryModal from '../../Modals/MediaLibraryModal';

const FeaturePropertyBlock = ({ block, onUpdate }) => {
    const [isMediaOpen, setIsMediaOpen] = useState(false);

    const handleChange = (field, value) => {
        onUpdate(block.id, { [field]: value });
    };

    const handleImageSelect = (src) => {
        handleChange('image', src);
        setIsMediaOpen(false);
    };

    return (
        <div className="w-full font-sans" style={{ backgroundColor: theme.colors.white }}>
            {/* Image Section */}
            <div className="relative w-full h-64 bg-gray-100 group overflow-hidden">
                {block.image ? (
                    <img src={block.image} alt={block.name || 'Product'} className="w-full h-full object-cover" />
                ) : (
                    <div
                        className="w-full h-full flex flex-col items-center justify-center transition-colors"
                        style={{
                            backgroundColor: theme.colors.controls.bg,
                            color: theme.colors.controls.icon
                        }}
                    >
                        <FiPackage size={48} />
                        <span className="text-xs mt-2 uppercase tracking-widest font-bold">Featured Product</span>
                    </div>
                )}

                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsMediaOpen(true); }}
                        className="p-3 text-white rounded shadow-lg transition-transform hover:scale-105"
                        style={{ backgroundColor: theme.colors.primary }}
                        title="Change Image"
                    >
                        <FiCamera size={20} />
                    </button>
                    <button
                        className="p-3 bg-white rounded shadow-lg transition-transform hover:scale-105"
                        style={{ color: theme.colors.secondary }}
                        title="Layout Options"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <FiLayout size={20} />
                    </button>
                </div>
            </div>

            {/* Content Section */}
            <div
                className="p-4 flex flex-col gap-3 border-x border-b"
                style={{ borderColor: theme.colors.neutral[100] }}
            >
                {/* Category */}
                <input
                    type="text"
                    id="settings-input"
                    value={block.category || ''}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="w-full text-sm font-semibold px-3 py-2 rounded focus:outline-none focus:ring-2 uppercase tracking-wide"
                    style={{
                        backgroundColor: theme.colors.secondary,
                        color: theme.colors.white,
                        '--tw-ring-color': theme.colors.primary
                    }}
                    placeholder="Category e.g. Electronics"
                />

                {/* Product Name */}
                <input
                    type="text"
                    id="settings-input"
                    value={block.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full text-base font-semibold border px-3 py-2 rounded focus:outline-none"
                    style={{
                        backgroundColor: theme.colors.neutral[100],
                        borderColor: theme.colors.border,
                        color: theme.colors.text.primary
                    }}
                    placeholder="Product name"
                />

                {/* Price */}
                <div
                    className="flex items-center border rounded px-3 py-2 gap-2"
                    style={{
                        backgroundColor: theme.colors.white,
                        borderColor: theme.colors.border
                    }}
                >
                    <span className="text-[10px] font-bold uppercase" style={{ color: theme.colors.text.secondary }}>Price</span>
                    <input
                        type="text"
                        id="settings-input"
                        value={block.price || ''}
                        onChange={(e) => handleChange('price', e.target.value)}
                        className="flex-1 text-sm font-bold bg-transparent outline-none"
                        style={{ color: theme.colors.text.primary }}
                        placeholder="$0.00"
                    />
                </div>

                {/* Title / Headline */}
                <input
                    type="text"
                    value={block.title || ''}
                    id="settings-input"
                    onChange={(e) => handleChange('title', e.target.value)}
                    className="w-full text-sm font-bold border-none px-3 py-2 rounded focus:outline-none focus:ring-1 uppercase tracking-wide text-center"
                    style={{
                        backgroundColor: theme.colors.neutral[100],
                        color: theme.colors.secondary,
                        '--tw-ring-color': theme.colors.primary
                    }}
                    placeholder="Short headline or tagline"
                />

                {/* Description */}
                <textarea
                    value={block.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    className="w-full text-sm border rounded px-3 py-2 focus:outline-none min-h-[80px] resize-y font-light"
                    style={{
                        color: theme.colors.text.secondary,
                        borderColor: theme.colors.border
                    }}
                    placeholder="Product description..."
                />
            </div>

            <MediaLibraryModal
                isOpen={isMediaOpen}
                onClose={() => setIsMediaOpen(false)}
                onSelectImage={handleImageSelect}
            />
        </div>
    );
};

export default FeaturePropertyBlock;
