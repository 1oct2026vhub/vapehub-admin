import React from 'react';
import theme from '../../../theme';

const TabButton = ({ id, icon: Icon, label, activeTab, setActiveTab }) => (
    <button
        onClick={() => setActiveTab(id)}
        className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-2 transition-all duration-200 outline-none
            ${activeTab === id ? 'shadow-sm' : 'border-l-4 border-transparent'}`}
        style={activeTab === id ? {
            backgroundColor: theme.colors.white,
            color: theme.colors.black,
            borderLeft: `4px solid ${theme.colors.primary}`
        } : {
            color: theme.colors.text.secondary,
        }}
        onMouseEnter={(e) => {
            if (activeTab !== id) {
                e.currentTarget.style.backgroundColor = theme.colors.neutral[100];
            }
        }}
        onMouseLeave={(e) => {
            if (activeTab !== id) {
                e.currentTarget.style.backgroundColor = 'transparent';
            }
        }}
    >
        <Icon size={16} />
        {label}
    </button>
);

export default TabButton;
