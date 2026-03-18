import React, { useState, useEffect } from 'react';
import FontFamilyDropdown from './FontFamilyDropdown';
import LineHeightDropdown from './LineHeightDropdown';
import HeadingDropdown from './HeadingDropdown';
import PlaceholderDropdown from './PlaceholderDropdown';

import BasicFormattingGroup from './FormattingGroups/BasicFormattingGroup';
import AlignmentGroup from './FormattingGroups/AlignmentGroup';
import ColorGroup from './FormattingGroups/ColorGroup';
import RichTextGroup from './FormattingGroups/RichTextGroup';
import theme from '../../../theme';

const TextFormatting = ({ blockStyles, onUpdateStyles, onInsertText }) => {
    const [openDropdown, setOpenDropdown] = useState(null);
    const [activeFormats, setActiveFormats] = useState({
        bold: false,
        italic: false,
        underline: false,
        strikeThrough: false,
        insertUnorderedList: false,
        insertOrderedList: false,
        blockquote: false
    });

    const handleToggle = (dropdown) => {
        setOpenDropdown(openDropdown === dropdown ? null : dropdown);
    };

    const handleExec = (command, value = null) => {
        document.execCommand(command, false, value);
        checkActiveFormats();
    };

    const checkActiveFormats = () => {
        setActiveFormats({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            strikeThrough: document.queryCommandState('strikeThrough'),
            insertUnorderedList: document.queryCommandState('insertUnorderedList'),
            insertOrderedList: document.queryCommandState('insertOrderedList'),
            blockquote: document.queryCommandValue('formatBlock').toLowerCase() === 'blockquote'
        });
    };

    useEffect(() => {
        document.addEventListener('selectionchange', checkActiveFormats);
        return () => {
            document.removeEventListener('selectionchange', checkActiveFormats);
        };
    }, []);

    return (
        <div
            className="h-9 flex items-center px-2 gap-1 border-t border-white/10 text-white/60 overflow-x-auto overflow-y-hidden custom-scrollbar whitespace-nowrap mask-linear-fade"
            style={{ backgroundColor: theme.colors.accent }}
        >

            <BasicFormattingGroup activeFormats={activeFormats} handleExec={handleExec} />

            <AlignmentGroup blockStyles={blockStyles} onUpdateStyles={onUpdateStyles} />

            <ColorGroup openDropdown={openDropdown} handleToggle={handleToggle} handleExec={handleExec} />

            <RichTextGroup activeFormats={activeFormats} handleExec={handleExec} openDropdown={openDropdown} handleToggle={handleToggle} />

            {/* Dropdowns */}
            <HeadingDropdown
                currentFontSize={blockStyles.fontSize}
                onUpdateStyles={onUpdateStyles}
                isOpen={openDropdown === 'heading'}
                onToggle={() => handleToggle('heading')}
            />

            <FontFamilyDropdown
                currentFont={blockStyles.fontFamily}
                onUpdateStyles={onUpdateStyles}
                isOpen={openDropdown === 'font'}
                onToggle={() => handleToggle('font')}
            />

            <PlaceholderDropdown
                isOpen={openDropdown === 'placeholder'}
                onToggle={() => handleToggle('placeholder')}
                onInsert={(value) => {
                    if (onInsertText) {
                        onInsertText(value);
                    } else {
                        document.execCommand('insertText', false, value);
                    }
                }}
            />

            <LineHeightDropdown
                currentLineHeight={blockStyles.lineHeight}
                onUpdateStyles={onUpdateStyles}
                isOpen={openDropdown === 'lineHeight'}
                onToggle={() => handleToggle('lineHeight')}
            />
        </div>
    );
};

export default TextFormatting;
