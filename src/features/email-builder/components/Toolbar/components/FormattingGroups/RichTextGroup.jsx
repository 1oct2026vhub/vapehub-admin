import React from 'react';
import { MdFormatListBulleted, MdFormatListNumbered, MdFormatQuote } from 'react-icons/md';
import StyleButton from '../StyleButton';
import LinkDropdown from '../LinkDropdown';

const RichTextGroup = ({ activeFormats, handleExec, openDropdown, handleToggle }) => {
    return (
        <div className="flex items-center gap-0.5 border-r border-white/10 pr-1 mr-1 flex-shrink-0">
            <LinkDropdown
                isOpen={openDropdown === 'link'}
                onToggle={() => handleToggle('link')}
                onApply={(url) => handleExec('createLink', url)}
                onUnlink={() => handleExec('unlink')}
            />
            <StyleButton
                icon={MdFormatQuote}
                title="Quote"
                active={activeFormats.blockquote}
                onClick={() => handleExec('formatBlock', activeFormats.blockquote ? 'DIV' : 'BLOCKQUOTE')}
            />
            <StyleButton
                icon={MdFormatListBulleted}
                title="Bullet List"
                active={activeFormats.insertUnorderedList}
                onClick={() => handleExec('insertUnorderedList')}
            />
            <StyleButton
                icon={MdFormatListNumbered}
                title="Numbered List"
                active={activeFormats.insertOrderedList}
                onClick={() => handleExec('insertOrderedList')}
            />
        </div>
    );
};

export default RichTextGroup;
