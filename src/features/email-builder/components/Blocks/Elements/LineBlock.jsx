import React from 'react';
import theme from '../../../theme';

const LineBlock = ({ block }) => {
    // Line represented as a div with height and background color
    const styles = {
        width: block.styles?.width || '100%',
        height: block.styles?.height || '2px',
        backgroundColor: block.styles?.backgroundColor || theme.colors.secondary, // Default neat gray
        marginTop: block.styles?.padding?.split(' ')[0] || '10px',
        marginBottom: block.styles?.padding?.split(' ')[2] || '10px',
        // Support standard padding usage if provided (top/bottom)
        ...block.styles
    };

    // Check if this acts as a page break
    const isPageBreak = block.styles?.isPageBreak;

    if (isPageBreak) {
        return (
            <div
                className="relative"
                style={{
                    height: '40px',
                    backgroundColor: '#EAEEF3', // Matches canvas background color
                    marginLeft: '-48px',        // Pulling out of the padding (48px)
                    marginRight: '-48px',       // Pulling out of the padding (48px)
                    width: 'calc(100% + 96px)', // Full width + padding compensation
                    borderTop: '1px solid #E5E5E5',
                    borderBottom: '1px solid #E5E5E5',
                    zIndex: 0
                }}
            />
        );
    }

    return (
        <div className="w-full flex justify-center py-2">
            <div
                style={{
                    width: styles.width,
                    height: styles.height,
                    backgroundColor: styles.backgroundColor,
                    borderTopStyle: styles.borderStyle || 'none',
                    borderTopWidth: styles.borderWidth || '0px',
                    borderTopColor: styles.borderColor || 'transparent'
                }}
            />
        </div>
    );
};

export default LineBlock;
