import React, { useRef, useState, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { FiType, FiChevronDown } from 'react-icons/fi';
import theme from '../../../theme';

const FONTS = [
    { label: 'Default', value: 'inherit' },
    { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
    { label: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
    { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
    { label: 'Courier', value: '"Courier New", Courier, monospace' },
    { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Tahoma', value: 'Tahoma, Geneva, sans-serif' },
    { label: 'Inter', value: '"Inter", sans-serif' },
    { label: 'Roboto', value: '"Roboto", sans-serif' },
];

const FontFamilyDropdown = ({ currentFont, onUpdateStyles, isOpen, onToggle }) => {
    const currentFontLabel = FONTS.find(f => f.value === currentFont)?.label || 'Font';
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
                title="Font Family"
            >
                <FiType size={11} />
                <span className="max-w-[70px] truncate font-medium">
                    {currentFontLabel}
                </span>
                <FiChevronDown size={10} className="opacity-50" />
            </button>
            {isOpen && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[99999]" onClick={onToggle}>
                    <div
                        className="fixed bg-white rounded-md shadow-2xl py-1 z-[100000] max-h-60 overflow-y-auto border border-neutral-200 animate-in fade-in zoom-in-95 duration-100 w-48"
                        style={{
                            ...dropdownStyle,
                            transform: 'translateY(-100%)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-3 py-1.5 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Select Font</div>
                        {FONTS.map(font => (
                            <button
                                key={font.value}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateStyles({ fontFamily: font.value });
                                    onToggle();
                                }}
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-neutral-50 flex items-center justify-between ${currentFont === font.value ? 'bg-opacity-5' : 'text-neutral-700'}`}
                                style={currentFont === font.value ? {
                                    color: theme.colors.primary,
                                    backgroundColor: `${theme.colors.primary}0D` // 5% opacity
                                } : {}}
                            >
                                <span style={{ fontFamily: font.value === 'inherit' ? undefined : font.value }}>
                                    {font.label}
                                </span>
                                {currentFont === font.value && (
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

export default FontFamilyDropdown;
