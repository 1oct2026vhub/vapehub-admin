import React from 'react';
import { FiAlignLeft, FiAlignCenter, FiAlignRight } from 'react-icons/fi';
import StyleButton from '../StyleButton';

const AlignmentGroup = ({ blockStyles, onUpdateStyles }) => {
    return (
        <div className="flex items-center gap-0.5 border-r border-white/10 pr-1 mr-1 flex-shrink-0">
            <StyleButton icon={FiAlignLeft} title="Align Left" active={blockStyles.textAlign === 'left'} onClick={() => onUpdateStyles({ textAlign: 'left' })} />
            <StyleButton icon={FiAlignCenter} title="Align Center" active={blockStyles.textAlign === 'center'} onClick={() => onUpdateStyles({ textAlign: 'center' })} />
            <StyleButton icon={FiAlignRight} title="Align Right" active={blockStyles.textAlign === 'right'} onClick={() => onUpdateStyles({ textAlign: 'right' })} />
        </div>
    );
};

export default AlignmentGroup;
