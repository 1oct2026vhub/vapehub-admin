import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { RxHeight } from 'react-icons/rx';
import {
    FiType,
    FiColumns,
    FiImage,
    FiGrid,
    FiList,
    FiMenu,
    FiChevronDown,
    FiChevronUp,
    FiTable,
    FiMinus,
    FiSquare,
    FiShare2,
    FiPlayCircle,
    FiStar,
    FiAlignLeft,
    FiSidebar,
    FiLayout,
    FiMoreHorizontal
} from 'react-icons/fi';

import {
    IconImage1, IconImage2, IconImage3, IconImage4,
    IconTextMedia2x1, IconTextMedia1x2, IconTextMedia2x2, IconTextMedia3x2
} from '../CustomIcons';
import theme from '../../theme';

const ComponentGroup = ({ title, children, isOpen = true }) => {
    const [open, setOpen] = useState(isOpen);
    return (
        <div className="mb-2">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center justify-between w-full p-2 text-[10px] font-bold uppercase hover:bg-white/5 transition-colors mb-2 tracking-widest"
                style={{ color: theme.colors.primary }}
            >
                {title}
                {open ? <FiChevronUp /> : <FiChevronDown />}
            </button>
            {open && <div className="grid grid-cols-4 gap-2 px-2 pb-4">{children}</div>}
        </div>
    );
};

const ToolItem = ({ icon: Icon, label, id }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: id,
    });

    const isDragging = !!transform;
    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 100,
        position: 'relative'
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                backgroundColor: theme.colors.accent,
                borderColor: 'transparent'
            }}
            {...listeners}
            {...attributes}
            className={`aspect-square cursor-grab active:cursor-grabbing flex flex-col items-center justify-center gap-1 transition-all group rounded-sm border hover:border-current ${isDragging ? 'opacity-0' : 'opacity-100'}`}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.neutral[200] + '10'; // slight light overlay
                e.currentTarget.style.borderColor = theme.colors.primary + '4D'; // 30% alpha
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.accent;
                e.currentTarget.style.borderColor = 'transparent';
            }}
        >
            <Icon size={14} className="group-hover:text-white transition-colors" style={{ color: theme.colors.text.muted }} />
            <span
                className="text-[7px] group-hover:text-white uppercase font-bold text-center leading-none tracking-tight px-1"
                style={{ color: theme.colors.text.muted }}
            >
                {label}
            </span>
        </div>
    );
};

const ComponentPanel = () => {
    return (
        <div
            className="w-full flex flex-col h-full overflow-y-auto border-l border-white/5 custom-scrollbar-dark"
            style={{ backgroundColor: theme.colors.black }}
        >
            <div className="p-2 pt-4">
                <ComponentGroup title="Text">
                    <ToolItem icon={FiType} label="Heading" id="tool-heading" />
                    <ToolItem icon={FiAlignLeft} label="1 Column" id="tool-col-1" />
                    <ToolItem icon={FiSidebar} label="2 Column" id="tool-col-2" />
                    <ToolItem icon={FiLayout} label="3 Column" id="tool-col-3" />
                </ComponentGroup>

                <ComponentGroup title="Images">
                    <ToolItem icon={IconImage1} label="1 Image" id="tool-img-1" />
                    <ToolItem icon={IconImage2} label="2 Image" id="tool-img-2" />
                    <ToolItem icon={IconImage3} label="3 Image" id="tool-img-3" />
                    <ToolItem icon={IconImage4} label="4 Image" id="tool-img-4" />
                </ComponentGroup>

                <ComponentGroup title="Text & Images">
                    <ToolItem icon={FiSidebar} label="2x1" id="tool-text-media" />
                    <ToolItem icon={FiLayout} label="1x2" id="tool-mix-1x2" />
                    <ToolItem icon={FiGrid} label="2x2" id="tool-mix-2x2" />
                    <ToolItem icon={FiTable} label="3x2" id="tool-mix-3x2" />
                </ComponentGroup>

                <ComponentGroup title="Product">
                    <ToolItem icon={FiGrid} label="Product Grid" id="tool-prop-grid" />
                    <ToolItem icon={FiList} label="Product List" id="tool-prop-list" />
                    <ToolItem icon={FiStar} label="Featured Product" id="tool-prop-feature" />
                    {/* <ToolItem icon={FiTable} label="Table" id="tool-prop-table" /> */}
                    {/* <ToolItem icon={FiType} label="Text" id="tool-prop-text" /> */}
                </ComponentGroup>

                <ComponentGroup title="Page Elements">
                    <ToolItem icon={FiMinus} label="Line" id="tool-el-line" />
                    <ToolItem icon={FiMoreHorizontal} label="Breaker" id="tool-el-breaker" />
                    <ToolItem icon={FiSquare} label="Button" id="tool-el-button" />
                    <ToolItem icon={RxHeight} label="Spacer" id="tool-el-spacer" />
                </ComponentGroup>

                <ComponentGroup title="Media">
                    <ToolItem icon={FiShare2} label="Social" id="tool-media-social" />
                    <ToolItem icon={FiPlayCircle} label="Video" id="tool-media-video" />
                </ComponentGroup>
            </div>
        </div>
    );
};

export default ComponentPanel;
