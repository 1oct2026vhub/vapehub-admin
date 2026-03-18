import React from 'react';

// Common props for stroke-based icons to match react-icons/fi (Feather)
const defaultProps = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    viewBox: "0 0 24 24"
};

// --- Image Count Icons (Stroke Based) ---

export const IconImage1 = ({ size = "1em", ...props }) => (
    <svg width={size} height={size} {...defaultProps} {...props}>
        <path d="M3 19L12 6L21 19H3Z" />
        <circle cx="17" cy="7" r="1.5" />
    </svg>
);

export const IconImage2 = ({ size = "1em", ...props }) => (
    <svg width={size} height={size} {...defaultProps} {...props}>
        {/* Left Mountain */}
        <path d="M2 19L7 12L12 19H2Z" />
        {/* Right Mountain */}
        <path d="M12 19L17 12L22 19H12Z" />
    </svg>
);

export const IconImage3 = ({ size = "1em", ...props }) => (
    <svg width={size} height={size} {...defaultProps} {...props}>
        {/* 3 smaller overlapping mountains or side-by-side */}
        <path d="M1 19L5 13L9 19" />
        <path d="M8 19L12 13L16 19" />
        <path d="M15 19L19 13L23 19" />
    </svg>
);

export const IconImage4 = ({ size = "1em", ...props }) => (
    <svg width={size} height={size} {...defaultProps} {...props}>
        {/* 4 peaks */}
        <path d="M1 19L3.5 15L6 19" />
        <path d="M6.5 19L9 15L11.5 19" />
        <path d="M12 19L14.5 15L17 19" />
        <path d="M17.5 19L20 15L22.5 19" />
    </svg>
);

// --- Text & Image Layout Icons (Stroke Based) ---

export const IconTextMedia2x1 = ({ size = "1em", ...props }) => (
    <svg width={size} height={size} {...defaultProps} {...props}>
        <rect x="2" y="12" width="6" height="6" rx="1" />
        <circle cx="5" cy="15" r="1" fill="currentColor" stroke="none" />
        <line x1="12" y1="13" x2="22" y2="13" />
        <line x1="12" y1="17" x2="22" y2="17" />
    </svg>
);

export const IconTextMedia1x2 = ({ size = "1em", ...props }) => (
    <svg width={size} height={size} {...defaultProps} {...props}>
        <rect x="9" y="4" width="6" height="6" rx="1" />
        <circle cx="12" cy="7" r="1" fill="currentColor" stroke="none" />
        <line x1="8" y1="14" x2="16" y2="14" />
        <line x1="8" y1="18" x2="16" y2="18" />
    </svg>
);

export const IconTextMedia2x2 = ({ size = "1em", ...props }) => (
    <svg width={size} height={size} {...defaultProps} {...props}>
        {/* Col 1 */}
        <rect x="3" y="10" width="6" height="4" rx="1" />
        <line x1="3" y1="16" x2="9" y2="16" strokeWidth="1.5" />
        {/* Col 2 */}
        <rect x="15" y="10" width="6" height="4" rx="1" />
        <line x1="15" y1="16" x2="21" y2="16" strokeWidth="1.5" />
    </svg>
);

export const IconTextMedia3x2 = ({ size = "1em", ...props }) => (
    <svg width={size} height={size} {...defaultProps} {...props}>
        {/* Col 1 */}
        <rect x="1" y="9" width="5" height="4" rx="0.5" strokeWidth="1.5" />
        <line x1="1" y1="15" x2="6" y2="15" strokeWidth="1.5" />
        {/* Col 2 */}
        <rect x="9.5" y="9" width="5" height="4" rx="0.5" strokeWidth="1.5" />
        <line x1="9.5" y1="15" x2="14.5" y2="15" strokeWidth="1.5" />
        {/* Col 3 */}
        <rect x="18" y="9" width="5" height="4" rx="0.5" strokeWidth="1.5" />
        <line x1="18" y1="15" x2="23" y2="15" strokeWidth="1.5" />
    </svg>
);
