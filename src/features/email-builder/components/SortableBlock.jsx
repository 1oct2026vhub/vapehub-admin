import React from 'react';
import SortableBlockContainer from './Blocks/SortableBlockContainer';
import TextBlock from './Blocks/Text/TextBlock';
import ImageBlock from './Blocks/Images/ImageBlock';
import SpacerBlock from './Blocks/Elements/SpacerBlock';
import LineBlock from './Blocks/Elements/LineBlock';
import ButtonBlock from './Blocks/Elements/ButtonBlock';
import TextWithMediaBlock from './Blocks/TextMedia/TextWithMediaBlock';
import ImageGridBlock from './Blocks/Images/ImageGridBlock';
import MultiColumnBlock from './Blocks/Text/MultiColumnBlock';
import CardBlock from './Blocks/TextMedia/CardBlock';
import CardGridBlock from './Blocks/TextMedia/CardGridBlock';
import SocialBlock from './Blocks/Media/SocialBlock';
import VideoBlock from './Blocks/Media/VideoBlock';
import FeaturePropertyBlock from './Blocks/Property/FeaturePropertyBlock';
import PropertyGridBlock from './Blocks/Property/PropertyGridBlock';
import PropertyListBlock from './Blocks/Property/PropertyListBlock';

export const SortableBlock = ({ block, onDelete, onUpdate, onDuplicate, onMove }) => {
    const renderContent = () => {
        const type = (block.type || '').toLowerCase().trim();

        if (type.includes('property_feature')) {
            return <FeaturePropertyBlock block={block} onUpdate={onUpdate} />;
        }
        if (type.includes('property_grid')) {
            return <PropertyGridBlock block={block} onUpdate={onUpdate} />;
        }
        if (type.includes('property_list')) {
            return <PropertyListBlock block={block} onUpdate={onUpdate} />;
        }

        if (type === 'header' || type === 'subheader' || type === 'text') {
            return <TextBlock block={block} onUpdate={onUpdate} />;
        }

        if (type === 'image_grid') {
            return <ImageGridBlock block={block} onUpdate={onUpdate} />;
        }

        if (type === 'image' || type.startsWith('img')) {
            return <ImageBlock block={block} onUpdate={onUpdate} />;
        }
        if (type === 'text_with_media') {
            return <TextWithMediaBlock block={block} onUpdate={onUpdate} />;
        }
        if (type === 'card') {
            return <CardBlock block={block} onUpdate={onUpdate} />;
        }
        if (type === 'card_grid') {
            return <CardGridBlock block={block} onUpdate={onUpdate} />;
        }
        if (type.includes('columns')) {
            return <MultiColumnBlock block={block} onUpdate={onUpdate} />;
        }
        if (type.includes('spacer')) {
            return <SpacerBlock block={block} onUpdate={onUpdate} />;
        }
        if (type === 'line') {
            return <LineBlock block={block} onUpdate={onUpdate} />;
        }
        if (type === 'button') {
            return <ButtonBlock block={block} onUpdate={onUpdate} />;
        }
        if (type === 'social') {
            return <SocialBlock block={block} onUpdate={onUpdate} />;
        }
        if (type === 'video' || type.includes('video')) {
            return <VideoBlock block={block} onUpdate={onUpdate} />;
        }
        return <div className="p-4 bg-neutral-100 text-xs text-neutral-400">Unknown Block: {block.type}</div>;
    };

    return (
        <SortableBlockContainer
            block={block}
            onDelete={onDelete}
            onUpdate={onUpdate}
            onDuplicate={onDuplicate}
            onMove={onMove}
        >
            {renderContent()}
        </SortableBlockContainer>
    );
};
