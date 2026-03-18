import React, { useRef, useState, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { FiLink } from 'react-icons/fi';
import { BiUnlink } from 'react-icons/bi';
import theme from '../../../theme';

const LinkDropdown = ({ isOpen, onToggle, onApply, onUnlink }) => {
    const buttonRef = useRef(null);
    const inputRef = useRef(null);
    const savedRangeRef = useRef(null);
    const [url, setUrl] = useState('https://');
    const [dropdownStyle, setDropdownStyle] = useState({});

    useLayoutEffect(() => {
        if (isOpen) {
            // Save current selection range logic
            // We need to capture the selection from the document, which should still be in the editor
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                savedRangeRef.current = selection.getRangeAt(0);
            }

            if (buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                setDropdownStyle({
                    top: `${rect.top - 8}px`,
                    left: `${rect.left}px`,
                });
                // Focus input after render
                setTimeout(() => inputRef.current?.focus(), 50);
            }
        }
    }, [isOpen]);

    const restoreSelection = () => {
        if (savedRangeRef.current) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(savedRangeRef.current);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        restoreSelection();
        onApply(url);
        onToggle();
    };

    const handleUnlink = () => {
        restoreSelection();
        if (onUnlink) onUnlink();
        onToggle();
    };

    return (
        <div className="relative border-r border-white/10 pr-2 mr-1 h-full flex items-center">
            <button
                ref={buttonRef}
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                className={`flex items-center gap-1.5 text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition-colors ${isOpen ? 'text-white bg-white/10' : 'text-white/80'}`}
                title="Insert Link"
            >
                <FiLink size={14} />
            </button>
            {isOpen && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[99999]" onClick={onToggle}>
                    <div
                        className="fixed bg-white rounded-md shadow-2xl p-3 z-[100000] border border-neutral-200 animate-in fade-in zoom-in-95 duration-100 w-72"
                        style={{
                            ...dropdownStyle,
                            transform: 'translateY(-100%)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                        data-no-blur="true"
                    >
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Insert Link</div>
                            {onUnlink && (
                                <button
                                    onClick={handleUnlink}
                                    className="text-neutral-400 hover:text-red-500 text-xs flex items-center gap-1"
                                    title="Remove Link"
                                >
                                    <BiUnlink size={14} />
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                id='settings-input'
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="flex-1 bg-neutral-50 border border-neutral-200 rounded px-2 py-1.5 text-xs text-neutral-800 focus:outline-none"
                                style={{
                                    '--focus-ring': `${theme.colors.primary}`,
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = theme.colors.primary;
                                    e.target.style.boxShadow = `0 0 0 1px ${theme.colors.primary}`;
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#e5e5e5';
                                    e.target.style.boxShadow = 'none';
                                }}
                                placeholder="https://example.com"
                            />
                            <button
                                type="submit"
                                className="text-white rounded px-3 py-1 text-xs font-medium transition-colors"
                                style={{ backgroundColor: theme.colors.primary }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.primaryHover}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.primary}
                            >
                                Apply
                            </button>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default LinkDropdown;
