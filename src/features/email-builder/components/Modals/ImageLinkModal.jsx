import React from 'react';
import ReactDOM from 'react-dom';
import { FiChevronDown, FiX } from 'react-icons/fi';
import theme from '../../theme';

const ImageLinkModal = ({ isOpen, onClose, onSave, initialLink = '' }) => {
    const [link, setLink] = React.useState(initialLink);

    // Sync state when initialLink changes or modal opens
    React.useEffect(() => {
        if (isOpen) {
            setLink(initialLink || '');
        }
    }, [isOpen, initialLink]);

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
            <div
                className="bg-white w-[600px] rounded shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="py-4 px-6 flex justify-center relative border-b border-black/10"
                    style={{ backgroundColor: theme.colors.accent }}
                >
                    <span className="text-white text-sm font-semibold tracking-wider">Image</span>
                    <button onClick={onClose} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                        <FiX size={22} />
                    </button>
                </div>

                <div className="flex h-[380px]">
                    {/* Sidebar */}
                    <div className="w-[200px] flex flex-col pt-0 bg-neutral-200/20 border-r border-neutral-100" >
                        <div
                            className="px-6 py-4 flex items-center gap-3 border-l-[4px] shadow mt-3"
                            style={{
                                borderColor: theme.colors.primary,
                                backgroundColor: theme.colors.white,
                            }}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                            </svg>
                            <span className="text-[11px] font-black uppercase tracking-[0.15em]">Image Link</span>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-5 flex flex-col gap-5 bg-white">
                        {/* Link Type Section */}
                        <div className="flex flex-col gap-3">
                            <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Link Type</label>
                            <div className="relative">
                                <select
                                    className="w-full bg-white border border-neutral-200 rounded-md px-4 py-3 text-sm appearance-none focus:outline-none shadow-sm cursor-pointer transition-all"
                                    style={{ '--focus-border': theme.colors.primary }}
                                    onFocus={(e) => e.target.style.borderColor = theme.colors.primary}
                                    onBlur={(e) => e.target.style.borderColor = theme.colors.neutral[200]}
                                >
                                    <option>Web Address</option>
                                    <option>Email Address</option>
                                    <option>Page Link</option>
                                </select>
                                <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* URL Section */}
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">URL</label>
                            </div>
                            <input
                                type="text"
                                id='settings-input'
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                                placeholder="https://"
                                className="w-full bg-[#F3F4F6] border-none rounded-full px-8 py-5 text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-neutral-300 shadow-inner"
                                style={{ '--focus-ring': `${theme.colors.primary}33` }} // 20% opacity approx
                                onFocus={(e) => e.target.style.boxShadow = `0 0 0 2px ${theme.colors.primary}33`}
                                onBlur={(e) => e.target.style.boxShadow = 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="bg-neutral-200/20 border-t border-neutral-100  flex justify-end items-center gap-10">
                    <button
                        onClick={onClose}
                        className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.2em] hover:text-neutral-600 transition-colors"
                    >
                        CANCEL
                    </button>
                    <button
                        onClick={() => onSave(link)}
                        className="font-black px-10 py-3.5 rounded-sm text-[11px] uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95"
                        style={{ backgroundColor: theme.colors.primary }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.primaryHover}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.primary}
                    >
                        CONTINUE
                    </button>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default ImageLinkModal;
