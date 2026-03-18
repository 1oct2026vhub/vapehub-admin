import React from 'react';
import MoreOptionsDropdown from './MoreOptionsDropdown';
import SpacerControls from './components/SpacerControls';
import ActionButtons from './components/ActionButtons';
import TextFormatting from './components/TextFormatting';
import theme from '../../theme';

const BlockToolbar = ({
    isImageBlock, showMoreOptions, setShowMoreOptions,
    onDelete, onDuplicate, onMove, blockStyles = {}, onUpdateStyles,
    blockType = '', onEdit, isHovered, onInsertText
}) => {
    const isSpacer = blockType.toLowerCase().includes('spacer');
    const isGrid = blockType === 'image_grid';
    const isLine = blockType === 'line';
    const toggle = (key, value) => {
        const current = blockStyles[key];
        onUpdateStyles({ [key]: current === value ? undefined : value });
    };

    const spacerHeight = parseInt(blockStyles.height) || 40;

    return (
        <div
            className={`email-builder-toolbar absolute top-0 left-0 w-full z-[100] transform -translate-y-full transition-all duration-200 pointer-events-auto shadow-2xl ${isHovered ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div className="absolute top-full left-0 w-full h-2 -z-10" />

            {/* Top Toolbar Row */}
            <div
                className={`h-9 flex items-center px-3 gap-3 text-white justify-end select-none relative ${isSpacer ? 'rounded-sm' : 'rounded-t-sm'}`}
                style={{ backgroundColor: theme.colors.accent }}
            >
                {isSpacer && <SpacerControls spacerHeight={spacerHeight} onUpdateStyles={onUpdateStyles} />}

                <ActionButtons
                    isSpacer={isSpacer}
                    onEdit={onEdit}
                    onDuplicate={onDuplicate}
                    onMove={onMove}
                    showMoreOptions={showMoreOptions}
                    setShowMoreOptions={setShowMoreOptions}
                    isImageBlock={isImageBlock}
                    blockType={blockType}
                />

                {showMoreOptions && <MoreOptionsDropdown onDelete={onDelete} onDuplicate={onDuplicate} onClose={() => setShowMoreOptions(false)} />}
            </div>

            {/* Bottom Formatter Row - Hide for Image and Spacer */}
            {!isImageBlock && !isSpacer && !isGrid && !isLine && blockType !== 'video' && blockType !== 'social' && blockType !== 'property_feature' && blockType !== 'property_grid' && blockType !== 'property_list' && (
                <TextFormatting
                    blockStyles={blockStyles}
                    onUpdateStyles={onUpdateStyles}
                    toggle={toggle}
                    onInsertText={onInsertText}
                />
            )}
        </div>
    );
};

export default BlockToolbar;
