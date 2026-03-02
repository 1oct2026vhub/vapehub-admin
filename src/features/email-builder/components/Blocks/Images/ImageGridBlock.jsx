import React from 'react';
import SingleImage from './SingleImage';

const ImageGridBlock = ({ block, onUpdate }) => {
    // block.columns is an array of objects: [{ src: '', ... }, { src: '', ... }]
    const columns = block.columns || [];

    const handleColumnUpdate = (index, updates) => {
        const newColumns = [...columns];
        newColumns[index] = { ...newColumns[index], ...updates };
        onUpdate(block.id, { columns: newColumns });
    };

    const defaultHeight = columns.length === 2 ? '300px' : columns.length === 3 ? '200px' : '150px';

    return (
        <div className="flex w-full overflow-hidden" style={{ gap: block.styles?.gap || '8px' }}>
            {columns.map((col, index) => (
                <div key={index} className="flex-1 min-w-0">
                    <SingleImage
                        src={col.src}
                        alt={col.alt}
                        link={col.link}
                        label={`Image ${index + 1}`}
                        styles={{ width: '100%', height: block.styles?.height || defaultHeight }} // Responsive default height
                        onUpdate={(updates) => handleColumnUpdate(index, updates)}
                        showEditButton={true}
                    />
                </div>
            ))}
        </div>
    );
};

export default ImageGridBlock;
