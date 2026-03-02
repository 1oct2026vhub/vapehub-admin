import React from 'react';
import { FiChevronLeft, FiDownload } from 'react-icons/fi';
import { theme } from '../../theme';

const TopBar = ({ onBack, onSave, onPreview, backLabel = 'Return to Emails' }) => {
    return (
        <div
            className="flex items-center justify-between px-4 sm:px-6 shadow-sm z-50"
            style={{ backgroundColor: theme.colors.black }}
        >
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-neutral-200 hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider"
            >
                <FiChevronLeft size={16} />
                {backLabel}
            </button>

            <div className="flex items-center gap-3 py-2">
                <button
                    onClick={onPreview}
                    className="flex items-center gap-2 px-4 py-2 text-neutral-200 text-xs font-bold rounded hover:bg-neutral-300 hover:text-white transition-colors uppercase"
                    style={{
                        backgroundColor: theme.colors.accent
                    }}
                >
                    Preview
                    <FiDownload size={14} className="rotate-180" />
                </button>
                <button
                    onClick={onSave}
                    className="px-6 py-2 text-xs font-bold rounded transition-colors uppercase shadow-sm"
                    style={{
                        backgroundColor: theme.colors.primary
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.primaryHover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.primary}
                >
                    Save
                </button>
            </div>
        </div>
    );
};

export default TopBar;
