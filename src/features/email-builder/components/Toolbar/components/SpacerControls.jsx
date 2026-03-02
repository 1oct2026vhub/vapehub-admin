import React from 'react';
import theme from '../../../theme';

const SpacerControls = ({ spacerHeight, onUpdateStyles }) => {
    return (
        <div className="flex items-center gap-2 mr-auto ml-1 overflow-visible">
            <style>
                {`
                    .custom-height-input::-webkit-outer-spin-button,
                    .custom-height-input::-webkit-inner-spin-button {
                        -webkit-appearance: none;
                        margin: 0;
                    }
                    .custom-height-input {
                        -moz-appearance: textfield;
                        border: none !important;
                        outline: none !important;
                        box-shadow: none !important;
                        background: transparent !important;
                        height: 24px !important;
                        line-height: 24px !important;
                        color: #666 !important;
                    }
                `}
            </style>
            <span
                className="text-[9px] font-black uppercase tracking-[0.2em]"
                style={{ color: theme.colors.primary }}
            >
                Height
            </span>

            {/* Styled Container following User's Reference Component Logic */}
            <div
                className="flex items-center rounded-[4px] overflow-hidden h-6 transition-all"
                style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    borderWidth: '1px'
                }}
            >
                <input
                    type="number"
                    value={spacerHeight}
                    onChange={(e) => onUpdateStyles({ height: `${e.target.value}px` })}
                    className="custom-height-input w-11 text-[11px] font-bold text-center"
                />
                <div
                    className="flex flex-col h-full"
                    style={{ borderLeft: `1px solid ${theme.colors.border}` }}
                >
                    <button
                        onClick={() => onUpdateStyles({ height: `${spacerHeight + 1}px` })}
                        className="flex items-center justify-center px-1 text-[7px] h-1/2 transition-colors hover:bg-white/50"
                        style={{
                            color: theme.colors.text.muted,
                            borderBottom: `1px solid ${theme.colors.border}`,
                            '--hover-color': theme.colors.primary
                        }}
                        onMouseEnter={(e) => e.target.style.color = theme.colors.primary}
                        onMouseLeave={(e) => e.target.style.color = theme.colors.text.muted}
                    >
                        ▲
                    </button>
                    <button
                        onClick={() => onUpdateStyles({ height: `${Math.max(0, spacerHeight - 1)}px` })}
                        className="flex items-center justify-center px-1 text-[7px] h-1/2 transition-colors hover:bg-white/50"
                        style={{ color: theme.colors.text.muted }}
                        onMouseEnter={(e) => e.target.style.color = theme.colors.primary}
                        onMouseLeave={(e) => e.target.style.color = theme.colors.text.muted}
                    >
                        ▼
                    </button>
                </div>
            </div>

            <span className="text-[9px] text-white/40 font-bold">px</span>
        </div>
    );
};

export default SpacerControls;
