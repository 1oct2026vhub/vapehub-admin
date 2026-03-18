import React, { useRef, useState, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { FiChevronDown } from 'react-icons/fi';
import theme from '../../../theme';

const LINE_HEIGHTS = [
    { label: 'Normal', value: '1.625' },
    { label: 'Single', value: '1' },
    { label: '1.25', value: '1.25' },
    { label: '1.5', value: '1.5' },
    { label: 'Double', value: '2' }
];

const LineHeightDropdown = ({ currentLineHeight, onUpdateStyles, isOpen, onToggle }) => {
    const currentLineHeightLabel = LINE_HEIGHTS.find(lh => lh.value === currentLineHeight)?.label || 'Spacing';
    const buttonRef = useRef(null);
    const [dropdownStyle, setDropdownStyle] = useState({});

    useLayoutEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownStyle({
                top: `${rect.top - 8}px`,
                left: `${rect.left}px`,
            });
        }
    }, [isOpen]);

    return (
        <div className="relative border-r border-white/10 pr-2 mr-1 h-full flex items-center">
            <button
                ref={buttonRef}
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                className={`flex items-center gap-1.5 text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition-colors ${isOpen ? 'text-white bg-white/10' : 'text-white/80'}`}
                title="Line Spacing"
            >
                <span className="font-medium">{currentLineHeightLabel}</span>
                <FiChevronDown size={10} className="opacity-50" />
            </button>
            {isOpen && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[99999]" onClick={onToggle}>
                    <div
                        className="fixed bg-white rounded-md shadow-2xl py-1 z-[100000] border border-neutral-200 animate-in fade-in zoom-in-95 duration-100 w-32"
                        style={{
                            ...dropdownStyle,
                            transform: 'translateY(-100%)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-3 py-1.5 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Line Spacing</div>
                        {LINE_HEIGHTS.map(lh => (
                            <button
                                key={lh.value}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateStyles({ lineHeight: lh.value });
                                    onToggle();
                                }}
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-neutral-50 flex items-center justify-between ${currentLineHeight === lh.value ? 'bg-opacity-5' : 'text-neutral-700'}`}
                                style={currentLineHeight === lh.value ? {
                                    color: theme.colors.primary,
                                    backgroundColor: `${theme.colors.primary}0D` // 5% opacity
                                } : {}}
                            >
                                <span>{lh.label}</span>
                                {currentLineHeight === lh.value && (
                                    <div
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{ backgroundColor: theme.colors.primary }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default LineHeightDropdown;
