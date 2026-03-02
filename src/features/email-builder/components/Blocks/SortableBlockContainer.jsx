import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { useDndContext } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import BlockToolbar from '../Toolbar/BlockToolbar';
import BlockSettingsModal from '../BlockSettings/index';
import theme from '../../theme';

const SortableBlockContainer = ({ block, onDelete, onUpdate, onDuplicate, onMove, children }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [showMoreOptions, setShowMoreOptions] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const containerRef = useRef(null);

    // transform for sortable
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: block.id,
        disabled: isEditing
    });

    // Get global drag state to show indicator for external tools
    const { active, over } = useDndContext();
    const isOverCurrent = over?.id === block.id;
    const isActiveTool = active?.id?.startsWith('tool-');
    const showDropIndicator = isOverCurrent && isActiveTool && !isDragging;

    const style = {
        transform: CSS.Translate.toString(transform),
        transition: isDragging ? 'none' : transition,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative',
        zIndex: isDragging ? 999 : (isEditing || showMoreOptions || isHovered || isSettingsOpen ? 1000 : 'auto'),
    };

    const onUpdateStyles = (newStyles) => {
        onUpdate(block.id, { styles: { ...block.styles, ...newStyles } });
    };

    const handleInsertText = (text) => {
        // Appends text to the current content
        // Note: Ideally we insert at cursor, but appending is safer without a complex editor ref context
        // If content is just a string
        const currentContent = typeof block.content === 'string' ? block.content : '';
        onUpdate(block.id, { content: currentContent + text });
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setShowMoreOptions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isImage = block.type === 'image' || block.type.startsWith('img');
    const mbClass = (block.type === 'spacer' || block.styles?.isPageBreak) ? 'mb-0' : 'my-1.5';

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`relative w-full ${mbClass} outline-none transition-all ${isEditing ? 'cursor-text' : 'cursor-grab active:cursor-grabbing'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                if (!showMoreOptions) setIsHovered(false);
            }}
        >
            <div ref={containerRef}>
                <BlockToolbar
                    isImageBlock={isImage}
                    blockType={block.type}
                    showMoreOptions={showMoreOptions}
                    setShowMoreOptions={setShowMoreOptions}
                    onDelete={() => onDelete(block.id)}
                    blockStyles={block.styles}
                    onUpdateStyles={onUpdateStyles}
                    onDuplicate={onDuplicate}
                    onMove={onMove}
                    onEdit={() => setIsSettingsOpen(true)}
                    isHovered={isHovered}
                    onInsertText={handleInsertText}
                />

                {isSettingsOpen && (
                    <BlockSettingsModal
                        isOpen={isSettingsOpen}
                        onClose={() => setIsSettingsOpen(false)}
                        block={block}
                        onUpdateBlock={(updates) => onUpdate(block.id, updates)}
                    />
                )}

                {isHovered && !isDragging && !isEditing && !isSettingsOpen && (
                    <div
                        className="absolute inset-0 border-[3px] pointer-events-none z-10 box-border"
                        style={{ borderColor: theme.colors.primary }}
                    />
                )}

                {/* Drop Indicator Logic: Only if dragging a tool over this block */}
                {showDropIndicator && (
                    <div className="absolute -bottom-[2px] -left-[60px] -right-[60px] z-50 pointer-events-none flex items-center justify-center">
                        {/* The Line */}
                        <div
                            style={{ backgroundColor: theme.colors.primary, boxShadow: `0 0 4px ${theme.colors.primary}` }}
                            className="h-[2px] w-full relative"
                        >
                            {/* Left Marker - Triangle pointing IN (Right) */}
                            <div
                                style={{ borderLeftColor: theme.colors.primary }}
                                className="absolute -left-[10px] top-1/2 -translate-y-1/2 w-20 h-5 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px]"
                            />

                            {/* Right Marker - Triangle pointing IN (Left) */}
                            <div
                                style={{ borderRightColor: theme.colors.primary }}
                                className="absolute -right-[10px] top-1/2 -translate-y-1/2 w-20 h-5 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[12px]"
                            />
                        </div>
                    </div>
                )}

                {React.cloneElement(children, { isEditing, setIsEditing, onUpdate })}
            </div>
        </div>
    );
};

export default SortableBlockContainer;
