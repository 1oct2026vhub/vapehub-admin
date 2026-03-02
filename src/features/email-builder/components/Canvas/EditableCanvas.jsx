import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableBlock } from '../SortableBlock';

const EditableCanvas = ({
    id,
    blocks = [],
    onDeleteBlock,
    onUpdateBlock,
    onDuplicateBlock,
    onMoveBlock
}) => {
    const { isOver, setNodeRef } = useDroppable({
        id: id,
    });

    const style = {
        transformOrigin: 'top center',
        borderColor: isOver ? '#56B6CB' : 'transparent',
        borderWidth: isOver ? '2px' : '0px',
        borderStyle: 'solid',
        transition: 'border-color 0.2s ease',
        minHeight: '600px',
    };

    return (
        <div className="relative group/page">
            <div
                ref={setNodeRef}
                id={id}
                className="w-[600px] bg-white shadow-sm p-12 cursor-default mx-auto flex flex-col mb-8 relative"
                style={style}
            >
                <div className="flex-1">
                    <SortableContext
                        id={id}
                        items={blocks.map(b => b.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {blocks.map((block) => (
                            <SortableBlock
                                key={block.id}
                                block={block}
                                onDelete={() => onDeleteBlock(block.id)}
                                onUpdate={onUpdateBlock}
                                onDuplicate={() => onDuplicateBlock(block.id)}
                                onMove={(dir) => onMoveBlock(block.id, dir)}
                            />
                        ))}
                    </SortableContext>

                    {blocks.length === 0 && (
                        <div className="h-[200px] flex items-center justify-center text-neutral-300 text-sm border-2 border-dashed border-neutral-100 rounded">
                            Drag components here
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditableCanvas;

