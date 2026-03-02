import { useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import Cropper from 'react-easy-crop';
import { FiCheck, FiZoomIn, FiZoomOut } from 'react-icons/fi';
import { getCroppedImg } from '../../utils/cropImage'; // Helper function we'll create
import theme from '../../theme';

const ASPECT_RATIOS = [
    { label: 'Free', value: null },
    { label: 'Square', value: 1 },
    { label: '4:3', value: 4 / 3 },
    { label: '16:9', value: 16 / 9 },
    { label: '3:2', value: 3 / 2 },
];

const ImageEditorModal = ({ isOpen, onClose, imageSrc, onSave }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [aspect, setAspect] = useState(null); // Default free
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            onSave(croppedImage);
            onClose();
        } catch (e) {
            console.error(e);
            alert('Failed to crop image');
        }
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div
                className="w-[90vw] h-[90vh] rounded-lg shadow-2xl flex flex-col overflow-hidden text-white"
                style={{ backgroundColor: theme.colors.accent }}
            >
                {/* Header */}
                <div
                    className="h-14 border-b border-white/10 flex items-center justify-between px-6"
                    style={{ backgroundColor: theme.colors.accent }}
                >
                    <h3 className="font-semibold tracking-wide">Edit Image</h3>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-1.5 text-sm text-white/70 hover:text-white transition-colors">Cancel</button>
                        <button
                            onClick={handleSave}
                            className=" px-6 py-1.5 rounded text-sm font-medium flex items-center gap-2 transition-colors"
                            style={{ backgroundColor: theme.colors.primary, color: theme.colors.black }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.primaryHover}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.primary}
                        >
                            <FiCheck /> Save Changes
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Canvas */}
                    <div className="flex-1 relative bg-[#1a1f26]">
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={aspect}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                            classes={{
                                containerClassName: 'crop-container',
                                mediaClassName: 'crop-media',
                                cropAreaClassName: 'crop-area'
                            }}
                        />
                    </div>

                    {/* Sidebar Controls */}
                    <div
                        className="w-64 border-l border-white/10 p-6 flex flex-col gap-8 z-10"
                        style={{ backgroundColor: theme.colors.accent }}
                    >
                        {/* Aspect Ratio */}
                        <div>
                            <label className="text-xs font-bold text-white/70 uppercase tracking-wider block mb-3">Aspect Ratio</label>
                            <div className="grid grid-cols-2 gap-2">
                                {ASPECT_RATIOS.map(ratio => (
                                    <button
                                        key={ratio.label}
                                        onClick={() => setAspect(ratio.value)}
                                        className={`px-3 py-2 rounded text-xs border transition-all ${aspect === ratio.value ? '' : 'border-white/10 text-white/70 hover:bg-white/5'}`}
                                        style={aspect === ratio.value ? {
                                            backgroundColor: theme.colors.primary,
                                            borderColor: theme.colors.primary,
                                            color: '#080808ff'
                                        } : {}}
                                    >
                                        {ratio.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Zoom */}
                        <div>
                            <label className="text-xs font-bold text-white/70 uppercase tracking-wider block mb-3">Zoom</label>
                            <div className="flex items-center gap-3">
                                <FiZoomOut className="text-white/50" />
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e) => setZoom(e.target.value)}
                                    className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                    style={{ '--thumb-color': theme.colors.primary }}
                                />
                                <style>
                                    {`
                                        input[type=range]::-webkit-slider-thumb {
                                            -webkit-appearance: none;
                                            width: 12px;
                                            height: 12px;
                                            background: ${theme.colors.primary};
                                            border-radius: 50%;
                                        }
                                    `}
                                </style>
                                <FiZoomIn className="text-white/50" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ImageEditorModal;
