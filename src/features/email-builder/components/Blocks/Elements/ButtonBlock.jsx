import React, { useRef, useEffect } from 'react';
import theme from '../../../theme';

const ButtonBlock = ({ block, onUpdate, isEditing, setIsEditing }) => {
    const textRef = useRef(null);

    useEffect(() => {
        if (textRef.current && block.content && !isEditing) {
            if (textRef.current.innerText !== block.content) {
                textRef.current.innerText = block.content;
            }
        }
    }, [block.content, isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        if (textRef.current) {
            onUpdate(block.id, { content: textRef.current.innerText });
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent new lines in button
            e.target.blur();
        }
    };

    const containerStyles = {
        textAlign: block.styles?.textAlign || 'center',
        padding: '10px 0' // Default container padding
    };

    const buttonStyles = {
        backgroundColor: block.styles?.backgroundColor || theme.colors.primary,
        color: block.styles?.color || theme.colors.black,
        padding: block.styles?.padding || '12px 24px',
        borderRadius: block.styles?.borderRadius || '4px',
        display: 'inline-block',
        textDecoration: 'none',
        border: 'none',
        fontSize: block.styles?.fontSize || '14px',
        fontWeight: block.styles?.fontWeight || 'bold',
        cursor: isEditing ? 'text' : 'pointer',
        ...block.styles
    };

    // Remove wrapper-specific styles from button element style to avoid conflict
    delete buttonStyles.textAlign;

    return (
        <div style={containerStyles}>
            <span
                ref={textRef}
                contentEditable={isEditing}
                suppressContentEditableWarning
                onBlur={handleBlur}
                onDoubleClick={(e) => {
                    e.stopPropagation(); // Prevent modal opening if any
                    setIsEditing(true);
                }}
                onKeyDown={handleKeyDown}
                style={buttonStyles}
                className="hover:opacity-90 transition-opacity empty:before:content-['Button'] outline-none"
            >
                {block.content}
            </span>
        </div>
    );
};

export default ButtonBlock;
