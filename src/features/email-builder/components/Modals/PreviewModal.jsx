import { useState } from 'react';
import { FiMonitor, FiSmartphone } from 'react-icons/fi';
import { generateHtml } from '../../../utils/jsonToHtml';
import theme from '../../theme';

const PreviewModal = ({ isOpen, onClose, subject, blocks }) => {
    const [viewMode, setViewMode] = useState('desktop'); // 'desktop' or 'mobile'

    if (!isOpen) return null;

    const htmlContent = generateHtml(subject, blocks);

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-neutral-100 animate-in fade-in duration-200">
            {/* Top Bar */}
            <div
                className="h-16 flex items-center justify-between px-6 shadow-md shrink-0"
                style={{ backgroundColor: theme.colors.secondary }}
            >
                <div className="w-20" /> {/* Spacer for balance */}

                {/* View Toggles */}
                <div className="flex bg-black/20 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('desktop')}
                        className={`p-2 rounded transition-all ${viewMode === 'desktop' ? 'bg-white shadow text-neutral-800' : 'text-white/60 hover:text-white'}`}
                        title="Desktop View"
                    >
                        <FiMonitor size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('mobile')}
                        className={`p-2 rounded transition-all ${viewMode === 'mobile' ? 'bg-white shadow text-neutral-800' : 'text-white/60 hover:text-white'}`}
                        title="Mobile View"
                    >
                        <FiSmartphone size={20} />
                    </button>
                </div>

                {/* Close Button */}
                <div className="w-20 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded text-xs font-bold uppercase tracking-wider bg-[#56B6CB] text-white hover:bg-[#4aa0b4] transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative flex justify-center bg-neutral-200/50 pt-8 pb-8">
                <div
                    className={`transition-all duration-300 shadow-2xl bg-white overflow-hidden flex flex-col`}
                    style={{
                        width: viewMode === 'mobile' ? '375px' : '100%',
                        maxWidth: viewMode === 'mobile' ? '375px' : '100%', // Desktop is usually full width of viewport in these previews, or constrained to email width
                        height: '100%',
                        // For email preview, usually we show the *email* width (600px) centered.
                        // But the user asked for "Desktop" view. 
                        // Real desktop clients show usually 100% with the 600px center container.
                        // So Iframe width 100% is correct.
                        borderRadius: viewMode === 'mobile' ? '24px' : '0px',
                        border: viewMode === 'mobile' ? '8px solid #1a1a1a' : 'none'
                    }}
                >
                    <iframe
                        title="Email Preview"
                        srcDoc={htmlContent}
                        className="w-full h-full bg-white"
                        style={{ border: 'none' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default PreviewModal;
