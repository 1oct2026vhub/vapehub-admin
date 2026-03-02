import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FiX, FiSearch, FiCheck, FiPackage } from 'react-icons/fi';
import theme from '../../theme';
import emailBuilderApi from '../../services/api';

const PropertySelectionModal = ({ isOpen, onClose, onSelectProperties }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProductIds, setSelectedProductIds] = useState([]);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            emailBuilderApi.getProducts()
                .then((data) => {
                    setProducts(data);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error('Failed to fetch products', err);
                    setLoading(false);
                });
        }
    }, [isOpen]);

    const handleToggleSelect = (product) => {
        setSelectedProductIds((prev) => {
            if (prev.includes(product.id)) return prev.filter((id) => id !== product.id);
            return [...prev, product.id];
        });
    };

    const handleConfirm = () => {
        const selected = products.filter((p) => selectedProductIds.includes(p.id));
        onSelectProperties(selected);
        onClose();
    };

    const filteredProducts = products.filter(
        (p) =>
            (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-[#616B79] w-[80%] h-[85%] shadow-2xl overflow-hidden flex flex-col rounded-md animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="px-6 py-4 flex items-center justify-between border-b border-white/10"
                    style={{ backgroundColor: theme.colors.secondary }}
                >
                    <div className="flex flex-col">
                        <h2 className="text-white text-lg font-semibold tracking-wide">Select Products</h2>
                        <p className="text-white/50 text-xs mt-1">Select the products you want to display in the grid.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-white/70 text-sm mr-4">
                            {selectedProductIds.length} Selected
                        </span>
                        <button
                            onClick={handleConfirm}
                            className="px-6 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all shadow-lg text-white"
                            style={{ backgroundColor: theme.colors.primary }}
                            disabled={selectedProductIds.length === 0}
                        >
                            Confirm Selection
                        </button>
                        <button
                            onClick={onClose}
                            className="text-white/60 hover:text-white transition-colors p-1"
                        >
                            <FiX size={24} />
                        </button>
                    </div>
                </div>

                {/* Sub-header / Search */}
                <div className="px-6 py-3 bg-[#545e6b] flex items-center justify-between shrink-0">
                    <div className="relative w-full max-w-md">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                        <input
                            type="text"
                            placeholder="Search products by name or category..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#4a5460] text-white placeholder-white/30 pl-10 pr-4 py-2 rounded border border-transparent focus:border-white/20 outline-none transition-all text-sm"
                        />
                    </div>
                </div>

                {/* Grid Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-[#343b47]">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-white/50">
                            Loading products...
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-white/30">
                            <FiPackage size={48} className="mb-4 opacity-50" />
                            <p>No products found matching your search.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredProducts.map((product) => {
                                const isSelected = selectedProductIds.includes(product.id);
                                return (
                                    <div
                                        key={product.id}
                                        onClick={() => handleToggleSelect(product)}
                                        className={`group relative bg-white rounded overflow-hidden cursor-pointer transition-all duration-200 border-2 ${isSelected ? 'border-teal-500 transform scale-[1.02]' : 'border-transparent hover:border-white/20'}`}
                                    >
                                        <div className="aspect-[4/3] relative bg-gray-200">
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className={`absolute inset-0 bg-teal-500/20 transition-opacity duration-200 flex items-center justify-center ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${isSelected ? 'bg-teal-500 text-white' : 'bg-white/80 text-gray-600'}`}>
                                                    <FiCheck size={16} />
                                                </div>
                                            </div>
                                            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded">
                                                {product.price}
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <h3 className="text-gray-900 font-bold text-sm truncate">{product.name}</h3>
                                            <p className="text-gray-500 text-xs truncate">{product.category}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default PropertySelectionModal;
