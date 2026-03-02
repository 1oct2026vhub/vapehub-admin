import ReactDOM from 'react-dom';
import { useState, useRef } from 'react';
import { FiX, FiUpload, FiSearch } from 'react-icons/fi';
import theme from '../../theme';

const MediaLibraryModal = ({ isOpen, onClose, onSelectImage }) => {
    const [uploadedImages, setUploadedImages] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const fileInputRef = useRef(null);

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);

        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const newImage = {
                        id: Date.now() + Math.random(),
                        name: file.name,
                        src: reader.result,
                        size: (file.size / 1024).toFixed(2) + ' KB',
                        date: new Date().toLocaleDateString()
                    };
                    setUploadedImages(prev => [newImage, ...prev]);
                };
                reader.readAsDataURL(file);
            }
        });
    };

    const handleImageSelect = (image) => {
        onSelectImage(image.src);
        onClose();
    };

    const filteredImages = uploadedImages.filter(img =>
        img.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div style={{ backgroundColor: theme.colors.neutral[200] }} className="w-full h-full  shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <style>
                    {`
                            #subject-input {
                                height: 36px !important;
                                border-radius: none !important;
                                border-bottom: 1px solid #b6b4b4ff !important;
                                outline: none !important;
                                border: none !important;
                                background-color: transparent !important;
                                padding: 0 40px !important;
                                font-size: 14px !important;
                                line-height: 20px !important;
                                width: 100% !important;
                                box-shadow: none !important;
                                color: #b6b4b4ff !important;
                            }
                            #subject-input:focus {
                                border-bottom: 1px solid #b6b4b4ff !important;
                                outline: none !important;
                                box-shadow: none !important;
                            }
                            #subject-input::placeholder {
                                color: #b6b4b4ff !important;
                            }
                        `}
                </style>
                {/* Header */}
                <div
                    className="px-6 py-2.5 flex items-center justify-between"
                    style={{ backgroundColor: theme.colors.black }}
                >
                    <h2 className="text-white text-lg font-semibold tracking-wide">My Images</h2>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 rounded text-xs font-semibold uppercase tracking-wider transition-all shadow-lg flex items-center gap-2"
                            style={{ backgroundColor: theme.colors.primary }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.primaryHover}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.primary}
                        >
                            <FiUpload size={16} />
                            Upload Media
                        </button>
                        <button
                            onClick={onClose}
                            className="text-white/60 hover:text-white transition-colors p-1"
                        >
                            <FiX size={24} />
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div style={{ backgroundColor: theme.colors.accent }} className="px-5 py-2.5">
                    <div className="relative max-w-md">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                        <input
                            id="subject-input"
                            type="text"
                            placeholder="Search My Images"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full text-white"
                        />
                    </div>
                </div>

                {/* Image Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    {filteredImages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-black">
                            <FiUpload size={64} className="mb-4 " />
                            <p className="text-lg font-medium mb-2">No images uploaded yet</p>
                            <p className="text-sm">Click "Upload Media" to add images to your library</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {filteredImages.map((image) => (
                                <div
                                    key={image.id}
                                    onClick={() => handleImageSelect(image)}
                                    className="rounded-lg overflow-hidden cursor-pointer hover:ring-2 transition-all group"
                                    style={{
                                        backgroundColor: theme.colors.accent,
                                        '--ring-color': theme.colors.primary
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = `0 0 0 2px ${theme.colors.primary}`}
                                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                                >
                                    <div className="aspect-video bg-[#1a1f2a] flex items-center justify-center overflow-hidden">
                                        <img
                                            src={image.src}
                                            alt={image.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                        />
                                    </div>
                                    <div className="p-3">
                                        <p className="text-white text-sm font-medium truncate mb-1">
                                            {image.name}
                                        </p>
                                        <div className="flex items-center justify-between text-xs text-white/40">
                                            <span>{image.size}</span>
                                            <span>{image.date}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Hidden File Input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                />
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default MediaLibraryModal;
