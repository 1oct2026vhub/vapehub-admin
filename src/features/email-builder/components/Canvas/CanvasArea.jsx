import React, { useState } from 'react';
import EditableCanvas from './EditableCanvas';
import SettingsBar from '../Layout/SettingsBar';
import ZoomControls from '../Layout/ZoomControls';

const CanvasArea = ({
    subject,
    setSubject,
    page,
    onDeleteBlock,
    onUpdateBlock,
    onDuplicateBlock,
    onMoveBlock
}) => {
    const [zoom, setZoom] = useState(1);

    return (
        <div className="flex flex-col flex-1 h-full bg-[#EAEEF3]/50 relative overflow-hidden">

            <ZoomControls zoom={zoom} setZoom={setZoom} />

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* SettingsBar is now inside the scrollable area */}
                <SettingsBar subject={subject} setSubject={setSubject} />

                <div className="p-12 flex flex-col items-center">
                    <div
                        className="transition-all duration-300 origin-top flex flex-col gap-8 pb-32 mx-auto"
                        style={{ transform: `scale(${zoom})` }}
                    >
                        <EditableCanvas
                            id={page.id}
                            blocks={page.blocks}
                            onDeleteBlock={onDeleteBlock}
                            onUpdateBlock={onUpdateBlock}
                            onDuplicateBlock={onDuplicateBlock}
                            onMoveBlock={onMoveBlock}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CanvasArea;

