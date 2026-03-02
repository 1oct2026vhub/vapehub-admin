import React, { useRef, useState, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { FiChevronDown } from 'react-icons/fi';
import { MdFormatColorText, MdFormatColorFill } from 'react-icons/md';
import theme from '../../../theme';

const COLORS = [
    // Theme Colors
    { value: theme.colors.primary, label: 'Primary Brand' },
    { value: theme.colors.secondary, label: 'Secondary Brand' },
    { value: theme.colors.accent, label: 'Accent' },
    { value: theme.colors.text.primary, label: 'Dark Text' },
    { value: theme.colors.text.secondary, label: 'Light Text' },

    // Standard Colors
    { value: '#000000', label: 'Black' },
    { value: '#4B5563', label: 'Dark Gray' },
    { value: '#9CA3AF', label: 'Gray' },
    { value: '#FFFFFF', label: 'White', border: true },
    { value: '#DC2626', label: 'Red' },
    { value: '#EA580C', label: 'Orange' },
    { value: '#D97706', label: 'Amber' },
    { value: '#16A34A', label: 'Green' },
    { value: '#0891B2', label: 'Cyan' },
    { value: '#2563EB', label: 'Blue' },
    { value: '#4F46E5', label: 'Indigo' },
    { value: '#7C3AED', label: 'Violet' },
    { value: '#DB2777', label: 'Pink' },
    { value: 'transparent', label: 'None', isClear: true }, // Only for background
];

const ColorPickerDropdown = ({ type = 'text', isOpen, onToggle, onSelect }) => {
    const buttonRef = useRef(null);
    const [dropdownStyle, setDropdownStyle] = useState({});

    useLayoutEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            // Align slightly differently for colors as it's a grid
            setDropdownStyle({
                top: `${rect.top - 8}px`,
                left: `${rect.left}px`,
            });
        }
    }, [isOpen]);

    const Icon = type === 'text' ? MdFormatColorText : MdFormatColorFill;
    const title = type === 'text' ? 'Text Color' : 'Background Color';
    const activeColors = type === 'text' ? COLORS.filter(c => !c.isClear) : COLORS;

    return (
        <div className="relative border-white/10 mr-1 h-full flex items-center">
            <button
                ref={buttonRef}
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                className={`flex items-center gap-1.5 text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition-colors ${isOpen ? 'text-white bg-white/10' : 'text-white/80'}`}
                title={title}
            >
                <Icon size={14} />
                <FiChevronDown size={10} className="opacity-50" />
            </button>
            {isOpen && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[99999]" onClick={onToggle}>
                    <div
                        className="fixed bg-white rounded-md shadow-2xl p-2 z-[100000] border border-neutral-200 animate-in fade-in zoom-in-95 duration-100"
                        style={{
                            ...dropdownStyle,
                            transform: 'translateY(-100%)',
                            width: '210px' // Wider for grid
                        }}
                        onClick={(e) => e.stopPropagation()}
                        data-no-blur="true"
                    >
                        <div className="px-1 pb-2 text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1 border-b border-neutral-100">
                            {title}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {activeColors.map((color, index) => (
                                <button
                                    key={`${color.value}-${index}`}
                                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelect(color.value);
                                        onToggle();
                                    }}
                                    className="w-6 h-6 rounded border border-transparent hover:scale-110 transition-transform flex items-center justify-center relative group"
                                    style={{
                                        backgroundColor: color.value === 'transparent' ? 'transparent' : color.value,
                                        borderColor: color.border ? '#E5E7EB' : 'transparent'
                                    }}
                                    title={color.label}
                                >
                                    {color.isClear && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-[1px] h-full bg-red-500 rotate-45 transform" />
                                        </div>
                                    )}
                                    {color.value === 'transparent' && !color.isClear /* Fallback visual */ && (
                                        <span className="text-[10px] text-neutral-400">T</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default ColorPickerDropdown;
