import React from 'react';
import CardItem from './CardItem';

const CardBlock = ({ block, onUpdate }) => {
    // block has { src, content, link, ... } directly on it for singular card
    // or we can structure it like columns, but usually single block uses root props.
    // In handleAddBlock for 'card', I set type='card', and content='...'. src is undefined initially.

    // We need to map block props to data object expected by CardItem.
    const data = {
        src: block.src,
        content: block.content,
        link: block.link,
        alt: block.alt
    };

    const handleUpdate = (updates) => {
        onUpdate(block.id, updates);
    };

    return (
        <div className="w-full">
            <CardItem
                data={data}
                onUpdate={handleUpdate}
                label={block.label}
                showEditButton={false}
                styles={block.styles}
            />
        </div>
    );
};

export default CardBlock;
