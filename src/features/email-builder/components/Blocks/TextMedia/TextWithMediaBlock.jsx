import React, { useEffect, useRef, useState } from 'react';
import { FiCamera, FiImage, FiLink } from 'react-icons/fi';
import ImageLinkModal from '../../Modals/ImageLinkModal';
import MediaLibraryModal from '../../Modals/MediaLibraryModal';
import theme from '../../../theme';

const TextWithMediaBlock = ({ block, onUpdate }) => {
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
    const [isEditingText, setIsEditingText] = useState(false);
    const textRef = useRef(null);

    // Initial content load
    useEffect(() => {
        if (textRef.current && block.content && !isEditingText) {
            if (textRef.current.innerHTML !== block.content) {
                textRef.current.innerHTML = block.content;
            }
        }
    }, [block.content, isEditingText]);

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

    const handleImageSelect = (imageSrc) => {
        onUpdate(block.id, { src: imageSrc });
    };

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
            onUpdate(block.id, { content: textRef.current.innerHTML });
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, text);
    };

    const ActionButtons = () => (
        <div className="flex gap-2 pointer-events-auto">
            <button
                onClick={(e) => { e.stopPropagation(); setIsMediaLibraryOpen(true); }}
                style={{ text: theme.colors.black, backgroundColor: theme.colors.primary }}
                className="w-8 h-8 flex items-center justify-center  rounded shadow transition-colors"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <FiCamera size={15} />
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); setIsLinkModalOpen(true); }}
                style={{ text: theme.colors.controls.bg }}
                className="w-8 h-8 flex items-center justify-center bg-white  rounded shadow hover:bg-neutral-100 transition-colors"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <FiLink size={15} />
            </button>
        </div>
    );

    return (
        <div className="flex w-full bg-white min-h-[250px] group">
            {/* Left Side: Image */}
            <div style={{ backgroundColor: theme.colors.controls.bg }} className="w-[40%] aspect-video relative flex flex-col items-center justify-center overflow-hidden group">
                {block.src ? (
                    <>
                        <img src={block.src} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20">
                            <ActionButtons />
                        </div>
                    </>
                ) : (
                    <>

                        <div className="mb-3 absolute opacity-0 group-hover:opacity-100 z-20">
                            <ActionButtons />
                        </div>
                        <FiImage
                            className="mb-2 group-hover:scale-110 transition-transform"
                            size={30}
                            style={{ color: theme.colors.controls.icon }}
                        />
                        <span className="text-[#647184] text-xs font-light tracking-wide">Image 1</span>
                    </>
                )}
            </div>

            {/* Right Side: Text */}
            <div className={`w-[60%] px-6 flex items-start ${isEditingText ? 'z-[101] relative' : ''}`}>
                <div
                    ref={textRef}
                    contentEditable={isEditingText}
                    suppressContentEditableWarning={true}
                    onClick={() => setIsEditingText(true)}
                    onBlur={handleTextBlur}
                    onPaste={handlePaste}
                    style={{
                        ...block.styles,
                        outline: 'none',
                        minHeight: '1em'
                    }}
                    className={`w-full text-neutral-600 leading-relaxed ${isEditingText ? 'cursor-text' : 'cursor-default'}
                    [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2
                    [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2
                    [&_blockquote]:border-l-4 [&_blockquote]:border-[#56B6CB] [&_blockquote]:bg-gray-50/50 [&_blockquote]:py-2 [&_blockquote]:px-3 [&_blockquote]:my-2 [&_blockquote]:italic`}
                />
            </div>

            <MediaLibraryModal
                isOpen={isMediaLibraryOpen}
                onClose={() => setIsMediaLibraryOpen(false)}
                onSelectImage={handleImageSelect}
            />

            <ImageLinkModal
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                onSave={(link) => { onUpdate(block.id, { link }); setIsLinkModalOpen(false); }}
                initialLink={block.link}
            />
        </div>
    );
};

export default TextWithMediaBlock;
