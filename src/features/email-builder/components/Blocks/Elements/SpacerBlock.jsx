import React from 'react';

const SpacerBlock = ({ block }) => {
    // Spacer is strictly for vertical gap. No text, no content.
    const height = block.styles?.height || '40px';

    return (
        <div
            style={{ height }}
            className="w-full transition-all group-hover:bg-[#56B6CB]/10 group-hover:outline group-hover:outline-[1px] group-hover:outline-dashed group-hover:outline-[#56B6CB]/40 relative"
        >
        </div>
    );
};

export default SpacerBlock;
