import React, { useRef, useState } from 'react';
import TextBlock from './TextBlock';

const MultiColumnBlock = ({ block, onUpdate }) => {
    // Columns are stored in block.columns, array of { content: '...' }
    // If not present, default to empty based on block type

    // We reuse TextBlock logic but stripped down for columns? 
    // Or we render multiple TextBlocks?
    // TextBlock component expects a 'block' object with { id, content, styles, type }.
    // Our columns are sub-blocks. We need to construct pseudo-blocks for them.

    const columns = block.columns || [];

    const handleColumnUpdate = (index, updates) => {
        const newColumns = [...columns];
        if (updates.content !== undefined) {
            newColumns[index] = { ...newColumns[index], content: updates.content };
        }
        // If we want to support styles per column, we'd need more complex logic.
        // For now, assume simplified text update.
        onUpdate(block.id, { columns: newColumns });
    };

    // Helper to create a pseudo block for TextBlock component
    const getPseudoBlock = (col, index) => ({
        id: `${block.id}-col-${index}`,
        content: col.content,
        type: 'text', // treat as text
        styles: { ...block.styles, ...col.styles } // merge block styles with col styles
    });

    const [editingIndex, setEditingIndex] = useState(null);

    return (
        <div className="flex w-full" style={{ gap: '16px' }}>
            {columns.map((col, index) => (
                <div key={index} className="flex-1 min-w-0">
                    <TextBlock
                        block={getPseudoBlock(col, index)}
                        isEditing={editingIndex === index}
                        setIsEditing={(isEd) => setEditingIndex(isEd ? index : null)}
                        onUpdate={(id, updates) => handleColumnUpdate(index, updates)}
                    />
                </div>
            ))}
        </div>
    );
};

export default MultiColumnBlock;
