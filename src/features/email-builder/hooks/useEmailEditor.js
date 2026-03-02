import { useState, useEffect } from 'react';
import { arrayMove } from '@dnd-kit/sortable';

export const useEmailEditor = (initialTemplate = null) => {
    // Initialize with template data if provided, otherwise use default
    const [page, setPage] = useState({
        id: 'page-1',
        blocks: initialTemplate?.blocks || []
    });

    // Update state when initialTemplate changes
    useEffect(() => {
        if (initialTemplate && initialTemplate.blocks) {
            console.log('DEBUG: useEmailEditor updating page with blocks:', initialTemplate.blocks.length);
            setPage({
                id: 'page-1',
                blocks: initialTemplate.blocks
            });
        }
    }, [initialTemplate]);

    const handleDeleteBlock = (blockId) => {
        setPage(prev => ({
            ...prev,
            blocks: prev.blocks.filter(b => b.id !== blockId)
        }));
    };

    const handleUpdateBlock = (blockId, updates) => {
        setPage(prev => ({
            ...prev,
            blocks: prev.blocks.map(b => b.id === blockId ? { ...b, ...updates } : b)
        }));
    };

    const handleDuplicateBlock = (blockId) => {
        setPage(prev => {
            const blockIndex = prev.blocks.findIndex(b => b.id === blockId);
            if (blockIndex === -1) return prev;

            const blockToDuplicate = prev.blocks[blockIndex];
            const duplicatedBlock = {
                ...blockToDuplicate,
                id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            };

            const newBlocks = [...prev.blocks];
            newBlocks.splice(blockIndex + 1, 0, duplicatedBlock);
            return { ...prev, blocks: newBlocks };
        });
    };

    const handleMoveBlock = (blockId, direction) => {
        setPage(prev => {
            const index = prev.blocks.findIndex(b => b.id === blockId);
            if (index === -1) return prev;

            const newIndex = direction === 'up' ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= prev.blocks.length) return prev;

            return {
                ...prev,
                blocks: arrayMove(prev.blocks, index, newIndex)
            };
        });
    };

    const handleReorderBlocks = (oldIndex, newIndex) => {
        setPage(prev => ({
            ...prev,
            blocks: arrayMove(prev.blocks, oldIndex, newIndex)
        }));
    };

    const handleAddBlock = (type, overId = null) => {
        const isSpacer = type.toLowerCase().includes('spacer');
        const isImage = type.toLowerCase() === 'image' || type.toLowerCase() === 'img';
        // Handle explicit image counts
        const isImage2 = type.toLowerCase().includes('image_2') || type === 'image_2';
        const isImage3 = type.toLowerCase().includes('image_3') || type === 'image_3';
        const isImage4 = type.toLowerCase().includes('image_4') || type === 'image_4';

        const isHeading = type.toLowerCase().includes('heading') || type.toLowerCase() === 'header';
        const isTextMedia = type.toLowerCase() === 'text_with_media'; // 2x1

        const isMix1x2 = type === 'mix_1x2';
        const isMix2x2 = type === 'mix_2x2';
        const isMix3x2 = type === 'mix_3x2';

        const isCol2 = type === 'columns_2';
        const isCol3 = type === 'columns_3';

        const isLine = type.toLowerCase().includes('line');
        const isButton = type.toLowerCase().includes('button');
        const isSocial = type.toLowerCase().includes('social');
        const isVideo = type.toLowerCase().includes('video');
        const isPropertyFeature = type === 'property_feature';
        const isPropertyGrid = type === 'property_grid';
        const isPropertyList = type === 'property_list';

        let newBlock = {
            id: `block-${Date.now()}`,
            type: '', // Will set below
            content: '',
            styles: isSpacer ? { height: '40px' } : {}
        };

        if (isSpacer) {
            newBlock.type = 'spacer';
        } else if (isLine) {
            newBlock.type = 'line';
            newBlock.styles = {
                width: '100%',
                height: '2px',
                backgroundColor: '#CBD5E0',
                padding: '10px 0 10px 0'
            };
        } else if (type === 'breaker') {
            newBlock.type = 'line';
            newBlock.styles = {
                width: '100%',
                height: '24px', // Height of the gap
                backgroundColor: 'transparent', // Looks like split
                border: 'none',
                margin: '20px calc(-50vw + 50%)', // Attempt to break out of container? No, container is fixed width.
                // To simulate a "page break", we need it to look like the canvas background (#EAEEF3/50).
                // But the blocks are inside a white container. 
                // So the block itself must be that color, and essentially "cut" the white page.
                // We'll set a special flag or just use styles that mimic the outer canvas.
                backgroundColor: '#F3F4F6', // Approximate match to canvas gray or transparent if we can mask parents
                // The user said "current page should feel like it breaking... entire page width should take that and the background color should the canvas background"
                // The canvas background in CanvasArea.jsx is `bg-[#EAEEF3]/50` which is roughly #F4F6F8.
                // And it needs to stretch full width of the block container.
                outerBackgroundColor: '#F4F6F8', // We might need a new prop for "canvas background" simulation
                isPageBreak: true
            };
        } else if (isButton) {
            newBlock.type = 'button';
            newBlock.content = 'Click Here';
            newBlock.link = '#';
            newBlock.styles = {
                backgroundColor: '#56B6CB',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '4px',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '14px'
            };
        } else if (isSocial) {
            newBlock.type = 'social';
            newBlock.socialData = [
                { id: 'facebook', network: 'Facebook', icon: 'FiFacebook', url: 'https://facebook.com', color: '#3b5998', enabled: true },
                { id: 'twitter', network: 'Twitter', icon: 'FiTwitter', url: 'https://twitter.com', color: '#1da1f2', enabled: true },
                { id: 'instagram', network: 'Instagram', icon: 'FiInstagram', url: 'https://instagram.com', color: '#e1306c', enabled: true },
                { id: 'linkedin', network: 'LinkedIn', icon: 'FiLinkedin', url: 'https://linkedin.com', color: '#0077b5', enabled: true }
            ];
            newBlock.styles = { align: 'center', padding: '10px 0', iconStyle: 'circle' };
        } else if (isVideo) {
            newBlock.type = 'video';
            newBlock.src = '';
            newBlock.thumbnail = '';
            newBlock.styles = { width: '100%' };
        } else if (isPropertyFeature) {
            newBlock.type = 'property_feature';
            newBlock.image = '';
            newBlock.name = '';
            newBlock.price = '';
            newBlock.category = '';
            newBlock.title = '';
            newBlock.description = '';
            newBlock.styles = { padding: '0px' };
        } else if (isPropertyGrid) {
            newBlock.type = 'property_grid';
            newBlock.title = 'Featured Products';
            newBlock.settings = {};
            newBlock.styles = { padding: '20px' };
        } else if (isPropertyList) {
            newBlock.type = 'property_list';
            newBlock.items = [];
            newBlock.styles = { padding: '20px' };
        } else if (isHeading) {
            newBlock.type = 'header';
            newBlock.content = 'New Heading';
        } else if (isTextMedia) {
            newBlock.type = 'text_with_media';
            newBlock.content = 'Enter some text here that relates to your image.';
            newBlock.label = 'Text with Media';
        } else if (isMix1x2) {
            newBlock.type = 'card';
            newBlock.content = 'Card Description Text';
            newBlock.label = 'Image & Text';
        } else if (isMix2x2 || isMix3x2) {
            newBlock.type = 'card_grid';
            const count = isMix2x2 ? 2 : 3;
            newBlock.columns = Array(count).fill(null).map(() => ({
                src: '',
                alt: 'Image',
                content: 'Card Description Text'
            }));
        } else if (isImage2 || isImage3 || isImage4) {
            newBlock.type = 'image_grid';
            const count = isImage2 ? 2 : isImage3 ? 3 : 4;
            newBlock.columns = Array(count).fill(null).map(() => ({ src: '', alt: 'Image' }));
        } else if (isImage || type.includes('img') && !type.includes('text')) {
            // Fallback single image if generic 'image' or single img-1
            newBlock.type = 'image';
            newBlock.label = 'Image Block';
        } else if (isCol2) {
            newBlock.type = 'columns_2';
            newBlock.columns = [
                { content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.t' },
                { content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.' }
            ];
        } else if (isCol3) {
            newBlock.type = 'columns_3';
            newBlock.columns = [
                { content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
                { content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
                { content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' }
            ];
        } else {
            // Default text
            newBlock.type = 'text';
            newBlock.content = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';
        }

        // Final fallback if type logic missed (e.g. img-1 coming as tool-img-1 from dnd)
        if (!newBlock.type) {
            if (type.includes('img-1')) newBlock.type = 'image';
            else newBlock.type = 'text';
        }

        setPage(prev => {
            const idx = overId ? prev.blocks.findIndex(b => b.id === overId) : -1;
            const cloned = [...prev.blocks];
            if (idx !== -1) cloned.splice(idx + 1, 0, newBlock);
            else cloned.push(newBlock);
            return { ...prev, blocks: cloned };
        });
    };

    return {
        page,
        handleDeleteBlock,
        handleUpdateBlock,
        handleDuplicateBlock,
        handleMoveBlock,
        handleReorderBlocks,
        handleAddBlock
    };
};

