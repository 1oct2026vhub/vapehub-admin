import { useState, useEffect } from 'react';
import { useEmailEditor } from './hooks/useEmailEditor';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, closestCorners } from '@dnd-kit/core';
import TopBar from './components/Layout/TopBar';

import CanvasArea from './components/Canvas/CanvasArea';
import ComponentPanel from './components/Layout/ComponentPanel';
import { mockTemplates } from './utils/mockData';
import { generateHtml } from './utils/jsonToHtml';
import { theme } from './theme';
import './EmailEditor.css';

/**
 * EmailEditor - works in two modes:
 * 1. Embedded: pass onBack, onSave(html, subject), onPreview to get callbacks (no router).
 * 2. Standalone: no props, uses default behaviour (alert on save, preview in new tab).
 */
const EmailEditor = ({
    initialTemplate: initialTemplateProp = null,
    onBack = null,
    onSave: onSaveCallback = null,
    onPreview: onPreviewCallback = null,
    backLabel
}) => {
    // When embedded, use prop; otherwise could be extended for router state/params later
    const initialTemplate = initialTemplateProp || null;

    const {
        page,
        handleDeleteBlock,
        handleUpdateBlock,
        handleDuplicateBlock,
        handleMoveBlock,
        handleReorderBlocks,
        handleAddBlock
    } = useEmailEditor(initialTemplate);

    const [subject, setSubject] = useState(initialTemplate?.subject || 'Your email subject');

    useEffect(() => {
        if (initialTemplate?.subject) {
            setSubject(initialTemplate.subject);
        }
    }, [initialTemplate]);

    const [activeId, setActiveId] = useState(null);


    const sensors = useSensors(useSensor(PointerSensor, {
        activationConstraint: { distance: 3 }
    }));

    const handleDragStart = (e) => setActiveId(e.active.id);

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;

        if (active.id.startsWith('tool-')) {
            const toolId = active.id.toLowerCase();
            let blockType = 'text';

            if (toolId.includes('spacer')) blockType = 'spacer';
            else if (toolId.includes('social')) blockType = 'social';
            else if (toolId.includes('video')) blockType = 'video';
            else if (toolId === 'tool-img-1') blockType = 'image';
            else if (toolId === 'tool-img-2') blockType = 'image_2';
            else if (toolId === 'tool-img-3') blockType = 'image_3';
            else if (toolId === 'tool-img-4') blockType = 'image_4';
            else if (toolId.includes('img') || toolId.includes('image')) blockType = 'image';
            else if (toolId.includes('heading') || toolId.includes('header')) blockType = 'header';
            else if (toolId.includes('line')) blockType = 'line';
            else if (toolId.includes('breaker')) blockType = 'breaker';
            else if (toolId.includes('button')) blockType = 'button';
            else if (toolId.includes('text-media')) blockType = 'text_with_media'; // 2x1
            else if (toolId.includes('mix-1x2')) blockType = 'mix_1x2';
            else if (toolId.includes('mix-2x2')) blockType = 'mix_2x2';
            else if (toolId.includes('mix-3x2')) blockType = 'mix_3x2';
            else if (toolId.includes('col-2')) blockType = 'columns_2';
            else if (toolId.includes('col-3')) blockType = 'columns_3';
            else if (toolId.includes('prop-feature')) blockType = 'property_feature';
            else if (toolId.includes('prop-grid')) blockType = 'property_grid';
            else if (toolId.includes('prop-list')) blockType = 'property_list';
            else if (toolId.includes('col') || toolId.includes('text')) blockType = 'text';

            handleAddBlock(blockType, over.id !== page.id ? over.id : null);
        } else {
            const oldIdx = page.blocks.findIndex(b => b.id === active.id);
            const newIdx = page.blocks.findIndex(b => b.id === over.id);
            if (oldIdx !== -1 && newIdx !== -1) {
                handleReorderBlocks(oldIdx, newIdx);
            }
        }
    };

    const handleSave = () => {
        const outputHTML = generateHtml(subject, page.blocks);
        if (typeof onSaveCallback === 'function') {
            onSaveCallback(outputHTML, subject);
        } else {
            console.log('TEMPLATE OUTPUT HTML (For Send):', outputHTML);
            alert('Template Saved! Check console for JSON (structure) and HTML (email ready) output.');
        }
    };

    const handlePreview = () => {
        if (typeof onPreviewCallback === 'function') {
            const html = generateHtml(subject, page.blocks);
            onPreviewCallback(html, subject);
        } else {
            localStorage.setItem('email_preview_data', JSON.stringify({ subject, blocks: page.blocks }));
            window.open('/email-builder/preview', '_blank');
        }
    };

    const handleBack = () => {
        if (typeof onBack === 'function') {
            onBack();
        }
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div
                className="flex flex-col h-screen w-full bg-neutral-25 overflow-hidden"
                style={{
                    '--color-primary': theme.colors.primary,
                    '--color-primary-hover': theme.colors.primaryHover,
                    '--color-border': theme.colors.border,
                    '--color-background': theme.colors.background
                }}
            >
                <TopBar
                    onBack={handleBack}
                    onSave={handleSave}
                    onPreview={handlePreview}
                    backLabel={backLabel ?? (typeof onBack === 'function' ? 'Close' : 'Return to Emails')}
                />
                <div className="flex flex-1 overflow-hidden w-full">
                    <div className="flex flex-col flex-1 w-[82%]">
                        <CanvasArea
                            subject={subject}
                            setSubject={setSubject}
                            page={page}
                            onDeleteBlock={handleDeleteBlock}
                            onUpdateBlock={handleUpdateBlock}
                            onDuplicateBlock={handleDuplicateBlock}
                            onMoveBlock={handleMoveBlock}
                        />
                    </div>
                    <div className="w-[18%]">
                        <ComponentPanel />
                    </div>
                </div>
                <DragOverlay dropAnimation={null}>
                    {activeId && (
                        <div
                            className="px-4 py-3 text-white text-[10px] font-bold rounded shadow-2xl border border-white/10 opacity-90 cursor-grabbing min-w-[100px] uppercase tracking-wider flex items-center justify-center"
                            style={{ backgroundColor: theme.colors.accent }}
                        >
                            {activeId.replace('tool-', '').toUpperCase()}
                        </div>
                    )}
                </DragOverlay>


            </div>
        </DndContext>
    );
};

export default EmailEditor;

