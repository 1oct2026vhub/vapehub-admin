import React, { useRef, useState, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { FiChevronDown, FiDatabase } from 'react-icons/fi';
import theme from '../../../theme';

const PLACEHOLDERS = [
    { label: 'First Name', value: '{{firstName}}' },
    { label: 'Last Name', value: '{{lastName}}' },
    { label: 'Email', value: '{{email}}' },
    { label: 'Company', value: '{{company}}' },
    { label: 'Unsubscribe', value: '{{unsubscribe}}' },
];

const PlaceholderDropdown = ({ isOpen, onToggle, onInsert }) => {
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

    const handleSelect = (value) => {
        // Since we might not have direct insert access, we might need to handle this via clipboard or parent.
        // For now, assume a prop onInsert is passed or we just close.
        if (onInsert) {
            onInsert(value);
        } else {
            console.log('Insert placeholder:', value);
            // Verify if we can hackily document.execCommand (deprecated but works)
            document.execCommand('insertText', false, value);
        }
        onToggle();
    };

    return (
        <div className="relative border-r border-white/10 pr-2 mr-1 h-full flex items-center flex-shrink-0">
            <button
                ref={buttonRef}
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                className={`flex items-center gap-1.5 text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition-colors ${isOpen ? 'text-white bg-white/10' : 'text-white/80'}`}
                title="Insert Placeholder"
            >
                <FiDatabase size={11} />
                <span className="max-w-[70px] truncate font-medium">
                    Placeholder
                </span>
                <FiChevronDown size={10} className="opacity-50" />
            </button>
            {isOpen && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[99999]" onClick={onToggle}>
                    <div
                        className="fixed bg-white rounded-md shadow-2xl py-1 z-[100000] animate-in fade-in zoom-in-95 duration-100 w-48"
                        style={{
                            ...dropdownStyle,
                            transform: 'translateY(-100%)',
                            border: `1px solid ${theme.colors.border}`
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-3 py-1.5 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Merge Tags</div>
                        {PLACEHOLDERS.map(ph => (
                            <button
                                key={ph.value}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelect(ph.value);
                                }}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-50 flex items-center justify-between"
                                style={{ color: theme.colors.text.primary }}
                            >
                                <span>{ph.label}</span>
                                <span className="text-[10px] text-neutral-400 font-mono">{ph.value}</span>
                            </button>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default PlaceholderDropdown;
