import React from 'react';
import { FiBold, FiItalic, FiUnderline } from 'react-icons/fi';
import StyleButton from '../StyleButton';

const BasicFormattingGroup = ({ activeFormats, handleExec }) => {
    return (
        <div className="flex items-center gap-0.5 border-r border-white/10 pr-1 mr-1 flex-shrink-0">
            <StyleButton icon={FiBold} title="Bold" active={activeFormats.bold} onClick={() => handleExec('bold')} />
            <StyleButton icon={FiItalic} title="Italic" active={activeFormats.italic} onClick={() => handleExec('italic')} />
            <StyleButton icon={FiUnderline} title="Underline" active={activeFormats.underline} onClick={() => handleExec('underline')} />
            <StyleButton label="S" title="Strikethrough" active={activeFormats.strikeThrough} onClick={() => handleExec('strikeThrough')} />
        </div>
    );
};

export default BasicFormattingGroup;
