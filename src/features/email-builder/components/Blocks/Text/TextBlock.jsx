import React, { useRef, useEffect } from 'react';

const TextBlock = ({ block, isEditing, setIsEditing, onUpdate }) => {
    const textRef = useRef(null);

    // Initial content load
    useEffect(() => {
        if (textRef.current && block.content && !isEditing) {
            if (textRef.current.innerHTML !== block.content) {
                textRef.current.innerHTML = block.content;
            }
        }
    }, [block.content, isEditing]);

    useEffect(() => {
        if (isEditing && textRef.current) {
            textRef.current.focus();
            // Move cursor to end of text
            const range = document.createRange();
            const selection = window.getSelection();
            range.selectNodeContents(textRef.current);
            range.collapse(false); // false = end, true = start
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }, [isEditing]);

    const handleBlur = (e) => {
        // Prevent disabling edit mode if clicking within the toolbar or its dropdowns
        if (e.relatedTarget && (
            e.relatedTarget.closest('.email-builder-toolbar') ||
            e.relatedTarget.getAttribute('data-no-blur') === 'true' ||
            e.relatedTarget.closest('[data-no-blur="true"]')
        )) {
            // Even if we don't blur, we should perhaps sync the content to state
            // so that if a style update happens, the 'stale' prop isn't empty.
            // But since we decoupled render from prop using the useEffect above,
            // we don't strictly need to sync immediately, as long as we don't overwrite.
            return;
        }

        if (!isEditing) return;
        setIsEditing(false);
        const newContent = textRef.current.innerHTML;
        onUpdate(block.id, { content: newContent });
    };

    const handleKeyDown = (e) => {
        // Allow default behavior
    };

    const handlePaste = (e) => {
        // Prevent default paste behavior which includes styles
        e.preventDefault();

        // Get plain text from clipboard
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');

        // Insert text at cursor position
        document.execCommand('insertText', false, text);
    };

    const blockStyles = block.styles || {};
    const Tag = block.type === 'header' ? 'h1' : 'div';
    const baseStyles = block.type === 'header'
        ? 'text-3xl font-bold tracking-wide text-neutral-800'
        : 'text-neutral-600 leading-relaxed';

    return (
        <Tag
            ref={textRef}
            contentEditable={isEditing}
            suppressContentEditableWarning={true}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onDoubleClick={() => setIsEditing(true)}
            style={{
                ...blockStyles,
                textAlign: blockStyles.textAlign || 'start',
                outline: 'none',
                minWidth: '50px'
            }}
            className={`${baseStyles} py-1 transition-all ${isEditing ? 'cursor-text' : 'cursor-text'} 
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ul]:text-left [&_ul]:inline-block
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_ol]:text-left [&_ol]:inline-block
            [&_blockquote]:border-l-4 [&_blockquote]:border-[#56B6CB] [&_blockquote]:bg-gray-50/50 [&_blockquote]:py-3 [&_blockquote]:px-4 [&_blockquote]:my-3 [&_blockquote]:rounded-r-lg [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:shadow-sm`}
        />
    );
};

export default TextBlock;
