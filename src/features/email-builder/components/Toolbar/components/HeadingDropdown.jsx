import React, { useRef, useState, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { FiType, FiChevronDown } from 'react-icons/fi';
import theme from '../../../theme';

const HEADING_OPTIONS = [
    { label: 'Paragraph', value: 'p', fontSize: '16px', fontWeight: 'normal' },
    { label: 'Heading 1', value: 'h1', fontSize: '32px', fontWeight: 'bold' },
    { label: 'Heading 2', value: 'h2', fontSize: '24px', fontWeight: 'bold' },
    { label: 'Heading 3', value: 'h3', fontSize: '20px', fontWeight: 'semi-bold' },
];

const HeadingDropdown = ({ currentFontSize, onUpdateStyles, isOpen, onToggle }) => {
    // Determine current selection based on font size. 
    // This is an approximation as relies on specific pixel values.
    const currentOption = HEADING_OPTIONS.find(h => h.fontSize === currentFontSize) || HEADING_OPTIONS[0];
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

    const handleSelect = (option) => {
        onUpdateStyles({
            fontSize: option.fontSize,
            fontWeight: option.fontWeight
        });
        onToggle();
    };

    return (
        <div className="relative border-r border-white/10 pr-2 mr-1 h-full flex items-center flex-shrink-0">
            <button
                ref={buttonRef}
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                className={`flex items-center gap-1.5 text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition-colors ${isOpen ? 'text-white bg-white/10' : 'text-white/80'}`}
                title="Heading Format"
            >
                <span className="font-serif font-bold text-xs">¶</span>
                <span className="max-w-[70px] truncate font-medium">
                    {currentOption.label}
                </span>
                <FiChevronDown size={10} className="opacity-50" />
            </button>
            {isOpen && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[99999]" onClick={onToggle}>
                    <div
                        className="fixed bg-white rounded-md shadow-2xl py-1 z-[100000] border border-neutral-200 animate-in fade-in zoom-in-95 duration-100 w-40"
                        style={{
                            ...dropdownStyle,
                            transform: 'translateY(-100%)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-3 py-1.5 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Format</div>
                        {HEADING_OPTIONS.map(option => (
                            <button
                                key={option.value}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelect(option);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-neutral-50 flex items-center justify-between ${currentOption.value === option.value ? 'bg-opacity-5' : 'text-neutral-700'}`}
                                style={currentOption.value === option.value ? {
                                    color: theme.colors.primary,
                                    backgroundColor: `${theme.colors.primary}0D` // 5% opacity
                                } : {}}
                            >
                                <span className={option.value === 'p' ? '' : 'font-bold'} style={{ fontSize: option.value === 'p' ? '12px' : '14px' }}>
                                    {option.label}
                                </span>
                                {currentOption.value === option.value && (
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

export default HeadingDropdown;
