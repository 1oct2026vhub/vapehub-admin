import React, { useState } from 'react';
import { FiPackage, FiAlertCircle } from 'react-icons/fi';
import theme from '../../../theme';
import PropertySelectionModal from '../../Modals/PropertySelectionModal';

const PropertyGridBlock = ({ block, onUpdate }) => {
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
                <div className="grid grid-cols-2 gap-4">
                    {products.map((product) => (
                        <div key={product.id} className="bg-white border rounded overflow-hidden" style={{ borderColor: theme.colors.border }}>
                            <div className="aspect-[4/3] relative bg-gray-100">
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-white text-[10px] py-1 px-2">
                                    <span className="font-bold">{product.price}</span>
                                </div>
                            </div>
                            <div className="p-3">
                                <h3 className="text-sm font-bold leading-tight mb-1" style={{ color: theme.colors.text.primary }}>{product.name}</h3>
                                <p className="text-xs mb-2" style={{ color: theme.colors.text.secondary }}>{product.category}</p>
                                <div className="mt-3 flex items-center justify-between">
                                    <span className="text-xs font-bold" style={{ color: theme.colors.text.primary }}>{product.price}</span>
                                    <button
                                        className="text-[10px] font-bold uppercase px-2 py-1 rounded transition-colors hover:opacity-80 text-white"
                                        style={{ backgroundColor: theme.colors.primary }}
                                    >
                                        View
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div
                        className="flex flex-col items-center justify-center border-2 border-dashed rounded min-h-[200px] cursor-pointer hover:bg-black/5 transition-colors gap-2"
                        style={{ borderColor: theme.colors.border }}
                        onClick={() => setIsModalOpen(true)}
                    >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100">
                            <FiPackage size={20} className="text-gray-400" />
                        </div>
                        <span className="text-xs font-medium text-gray-500">Edit Selection</span>
                    </div>
                </div>
            ) : (
                <div
                    className="w-full flex flex-col items-center justify-center p-8 text-center rounded-sm"
                    style={{ backgroundColor: theme.colors.controls.bg, minHeight: '280px', color: theme.colors.text.muted }}
                >
                    <div className="relative mb-6 opacity-30">
                        <FiPackage size={64} strokeWidth={1} />
                        <div className="absolute -top-1 -right-1 bg-transparent rounded-full">
                            <FiAlertCircle size={24} />
                        </div>
                    </div>
                    <button
                        className="px-6 py-2 text-xs uppercase tracking-widest font-medium shadow-sm transition-transform active:scale-95 mb-4"
                        style={{ backgroundColor: theme.colors.primary, color: theme.colors.secondary }}
                        onClick={() => setIsModalOpen(true)}
                    >
                        Select Products
                    </button>
                    <div className="flex flex-col gap-1 items-center max-w-sm opacity-60">
                        <h3 className="text-lg font-light">No products selected yet.</h3>
                        <p className="text-[10px] leading-tight mt-1">
                            Click &quot;Select Products&quot; to choose which products to display. You can search by name or category.
                        </p>
                    </div>
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

export default PropertyGridBlock;
