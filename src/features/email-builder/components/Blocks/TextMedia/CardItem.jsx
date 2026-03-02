import React, { useRef, useState, useEffect } from 'react';
import SingleImage from '../Images/SingleImage';

const CardItem = ({ data, onUpdate, label, showEditButton = true, styles = {} }) => {
    const [isEditingText, setIsEditingText] = useState(false);
    const textRef = useRef(null);

    // Initial content load
    useEffect(() => {
        if (textRef.current && data.content && !isEditingText) {
            if (textRef.current.innerHTML !== data.content) {
                textRef.current.innerHTML = data.content;
            }
        }
    }, [data.content, isEditingText]);

    // Handle focus when editing starts
    useEffect(() => {
        if (isEditingText && textRef.current) {
            textRef.current.focus();
            const range = document.createRange();
            const selection = window.getSelection();
            range.selectNodeContents(textRef.current);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }, [isEditingText]);

    const handleTextBlur = (e) => {
        // Prevent disabling edit mode if clicking within the toolbar
        if (e.relatedTarget && (
            e.relatedTarget.closest('.email-builder-toolbar') ||
            e.relatedTarget.getAttribute('data-no-blur') === 'true' ||
            e.relatedTarget.closest('[data-no-blur="true"]')
        )) {
            return;
        }

        setIsEditingText(false);
        if (textRef.current) {
            onUpdate({ content: textRef.current.innerHTML });
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, text);
    };

    return (
        <div className="flex flex-col w-full bg-white group border border-transparent hover:border-slate-200 transition-colors">
            {/* Top: Image */}
            <div className="w-full">
                <SingleImage
                    src={data.src}
                    alt={data.alt}
                    link={data.link}
                    label={label || 'Image'}
                    showEditButton={showEditButton}
                    styles={{ width: '100%' }}
                    onUpdate={(updates) => onUpdate(updates)}
                />
            </div>

            {/* Bottom: Text */}
            <div className={`py-4 ${isEditingText ? 'z-[101] relative' : ''}`}>
                <div
                    ref={textRef}
                    contentEditable={isEditingText}
                    suppressContentEditableWarning={true}
                    onClick={() => setIsEditingText(true)}
                    onBlur={handleTextBlur}
                    onPaste={handlePaste}
                    style={{
                        ...styles,
                        whiteSpace: 'pre-wrap',
                        outline: 'none',
                        minHeight: '1.5em'
                    }}
                    className={`w-full text-sm text-neutral-600 leading-relaxed ${isEditingText ? 'cursor-text' : 'cursor-default'}
                    [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2
                    [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2
                    [&_blockquote]:border-l-4 [&_blockquote]:border-[#56B6CB] [&_blockquote]:bg-gray-50/50 [&_blockquote]:py-2 [&_blockquote]:px-3 [&_blockquote]:my-2 [&_blockquote]:italic`}
                />
            </div>
        </div>
    );
};

export default CardItem;
