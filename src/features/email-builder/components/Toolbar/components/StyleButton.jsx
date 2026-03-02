
import React from 'react';
import theme from '../../../theme';

const StyleButton = ({ icon: Icon, active, onClick, title, label }) => (
    <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
        className={`p-1.5 rounded transition-colors flex items-center justify-center`}
        style={active ? {
            color: theme.colors.primary,
            backgroundColor: `${theme.colors.primary}0D` // 5% opacity
        } : {
            color: 'rgba(255, 255, 255, 0.6)'
        }}
        // We use style based hover if possible, but standard classes for hover are simpler.
        // Given we are inside a dark toolbar, white/10 is still appropriate for non-active hover. 
        // But for active, we want theme color.
        onMouseEnter={(e) => {
            if (!active) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }}
        onMouseLeave={(e) => {
            if (!active) e.currentTarget.style.backgroundColor = 'transparent';
        }}
        title={title}
    >
        {Icon ? <Icon size={13} /> : <span className="text-[11px] font-black">{label}</span>}
    </button>
);

export default StyleButton;
