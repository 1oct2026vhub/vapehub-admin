import React from 'react';
import CardItem from './CardItem';

const CardGridBlock = ({ block, onUpdate }) => {
    // block.columns is array of { src, content, link, alt }
    const columns = block.columns || [];

    const handleColumnUpdate = (index, updates) => {
        const newColumns = [...columns];
        newColumns[index] = { ...newColumns[index], ...updates };
        onUpdate(block.id, { columns: newColumns });
    };

    return (
        <div className="flex w-full" style={{ gap: block.styles?.gap || '16px' }}>
            {columns.map((col, index) => (
                <div key={index} className="flex-1 min-w-0">
                    <CardItem
                        data={col}
                        onUpdate={(updates) => handleColumnUpdate(index, updates)}
                        label={`Card ${index + 1}`}
                        showEditButton={false}
                        styles={block.styles}
                    />
                </div>
            ))}
        </div>
    );
};

export default CardGridBlock;
