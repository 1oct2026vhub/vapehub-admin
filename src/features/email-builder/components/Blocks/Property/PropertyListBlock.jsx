import React, { useState } from 'react';
import { FiPackage } from 'react-icons/fi';
import theme from '../../../theme';
import PropertySelectionModal from '../../Modals/PropertySelectionModal';

const PropertyListBlock = ({ block, onUpdate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleChange = (field, value) => {
        onUpdate(block.id, { [field]: value });
    };

    const handleProductsSelected = (selectedProducts) => {
        handleChange('items', selectedProducts);
    };

    const products = block.items || [];

    return (
        <div className="w-full font-sans">
            {products.length > 0 ? (
                <div className="flex flex-col gap-4">
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className="flex border p-0 overflow-hidden relative"
                            style={{
                                borderColor: theme.colors.primary,
                                backgroundColor: theme.colors.white
                            }}
                        >
                            <div
                                className="w-1/3 min-h-[120px] relative bg-gray-100 flex items-center justify-center"
                                style={{ backgroundColor: theme.colors.controls.bg }}
                            >
                                {product.image ? (
                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                    <FiPackage size={32} style={{ color: theme.colors.controls.icon }} />
                                )}
                            </div>
                            <div className="flex-1 p-3 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-sm font-bold leading-tight" style={{ color: theme.colors.text.primary }}>
                                        {product.name}
                                    </h3>
                                    <p className="text-xs font-bold mb-1" style={{ color: theme.colors.text.secondary }}>
                                        {product.category}
                                    </p>
                                    <p className="text-sm font-bold mt-1" style={{ color: theme.colors.text.primary }}>
                                        {product.price}
                                    </p>
                                </div>
                                <button
                                    className="border text-[10px] font-bold uppercase px-2 py-0.5 self-start mt-2 transition-colors hover:opacity-80"
                                    style={{
                                        borderColor: theme.colors.border,
                                        color: theme.colors.text.secondary,
                                        backgroundColor: 'transparent'
                                    }}
                                >
                                    View+
                                </button>
                            </div>
                            <div
                                className="absolute bottom-0 right-0 p-1.5"
                                style={{ backgroundColor: theme.colors.primary }}
                            >
                                <FiPackage size={12} color={theme.colors.white} />
                            </div>
                        </div>
                    ))}
                    <div
                        className="flex items-center justify-center border-2 border-dashed rounded min-h-[100px] cursor-pointer hover:bg-black/5 gap-2"
                        style={{ borderColor: theme.colors.border }}
                        onClick={() => setIsModalOpen(true)}
                    >
                        <FiPackage size={20} className="text-gray-400" />
                        <span className="text-xs font-medium text-gray-500">Add more products</span>
                    </div>
                </div>
            ) : (
                <div
                    className="w-full flex flex-col items-center justify-center p-8 text-center rounded-sm border-2 border-dashed cursor-pointer hover:bg-black/5 transition-colors"
                    style={{ borderColor: theme.colors.border, minHeight: '200px' }}
                    onClick={() => setIsModalOpen(true)}
                >
                    <FiPackage size={48} style={{ color: theme.colors.text.muted }} className="mb-3" />
                    <p className="text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
                        No products in list
                    </p>
                    <p className="text-xs mt-1" style={{ color: theme.colors.text.muted }}>
                        Click to select products
                    </p>
                </div>
            )}

            <PropertySelectionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSelectProperties={handleProductsSelected}
            />
        </div>
    );
};

export default PropertyListBlock;
