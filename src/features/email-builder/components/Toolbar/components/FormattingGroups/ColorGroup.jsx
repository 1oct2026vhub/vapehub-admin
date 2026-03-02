import React from 'react';
import ColorPickerDropdown from '../ColorPickerDropdown';

const ColorGroup = ({ openDropdown, handleToggle, handleExec }) => {
    return (
        <div className="flex items-center gap-0.5 border-r border-white/10 pr-1 mr-1 flex-shrink-0">
            <ColorPickerDropdown
                type="text"
                isOpen={openDropdown === 'textColor'}
                onToggle={() => handleToggle('textColor')}
                onSelect={(color) => handleExec('foreColor', color)}
            />
            <ColorPickerDropdown
                type="background"
                isOpen={openDropdown === 'bgColor'}
                onToggle={() => handleToggle('bgColor')}
                onSelect={(color) => handleExec('hiliteColor', color)}
            />
        </div>
    );
};

export default ColorGroup;
