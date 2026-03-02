// This will be a shared component used by ImageBlock and ImageGridBlock
import React, { useState } from 'react';
import { FiImage, FiUpload, FiLink, FiCrop } from 'react-icons/fi';
import ImageLinkModal from '../../Modals/ImageLinkModal';
import MediaLibraryModal from '../../Modals/MediaLibraryModal';
import ImageEditorModal from '../../Modals/ImageEditorModal';
import theme from '../../../theme';

const SingleImage = ({ src, alt, link, onUpdate, styles = {}, label, showEditButton = true }) => {
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    const handleImageSelect = (newSrc) => {
        onUpdate({ src: newSrc });
    };

    const handleCropSave = (newSrc) => {
        onUpdate({ src: newSrc });
    };

    const ActionButtons = () => (
        <div className="flex gap-2 mb-4 pointer-events-auto">
            <button
                onClick={(e) => { e.stopPropagation(); setIsMediaLibraryOpen(true); }}
                className="w-8 h-8 flex items-center justify-center rounded shadow transition-colors"
                style={{ backgroundColor: theme.colors.primary }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.primaryHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.primary}
                title="Upload/Select Image"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <FiUpload size={14} />
            </button>
            {src && showEditButton && (
                <button
                    onClick={(e) => { e.stopPropagation(); setIsEditorOpen(true); }}
                    className="w-8 h-8 flex items-center justify-center bg-white rounded shadow hover:bg-neutral-100 transition-colors"
                    style={{ color: theme.colors.secondary }}
                    title="Edit/Crop Image"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <FiCrop size={14} />
                </button>
            )}
            <button
                onClick={(e) => { e.stopPropagation(); setIsLinkModalOpen(true); }}
                className="w-8 h-8 flex items-center justify-center bg-white rounded shadow hover:bg-neutral-100 transition-colors"
                style={{ color: theme.colors.secondary }}
                title="Link Image"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <FiLink size={14} />
            </button>
        </div>
    );

    return (
        <div
            className="relative w-full flex flex-col transition-all overflow-hidden group"
            style={{
                width: styles.width || '100%',
                height: styles.height || 'auto'
            }}
        >
            {src ? (
                <div className="relative group w-full h-full">
                    <img
                        src={src}
                        alt={alt || "Email Image"}
                        className="w-full h-full object-cover block"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20">
                        <ActionButtons />
                    </div>
                </div>
            ) : (
                <div
                    className="w-full flex flex-col items-center justify-center group transition-colors relative"
                    style={{
                        height: styles.height ? '100%' : '300px',
                        backgroundColor: theme.colors.controls.bg
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.controls.bgHover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.controls.bg}
                >
                    <FiImage
                        className="mb-2 group-hover:scale-110 transition-transform"
                        size={30}
                        style={{ color: theme.colors.controls.icon }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <ActionButtons />
                    </div>
                    <span
                        className="text-xs font-light tracking-wide mt-2"
                        style={{ color: theme.colors.text.secondary }}
                    >
                        {label || "Image"}
                    </span>
                </div>
            )}

            <MediaLibraryModal
                isOpen={isMediaLibraryOpen}
                onClose={() => setIsMediaLibraryOpen(false)}
                onSelectImage={handleImageSelect}
            />

            <ImageLinkModal
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                onSave={(newLink) => { onUpdate({ link: newLink }); setIsLinkModalOpen(false); }}
                initialLink={link}
            />

            <ImageEditorModal
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                imageSrc={src}
                onSave={handleCropSave}
            />
        </div>
    );
};

export default SingleImage;
